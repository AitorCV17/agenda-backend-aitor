import { Request, Response } from 'express';
import { SharePermission } from '@prisma/client';
import { validate } from 'class-validator';
import prisma from '../utils/prisma';
import { TaskListDto, TaskDto } from '../dto/task.dto';
import { ShareItemDto } from '../dto/share.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

async function canEditList(userId: number, listId: number): Promise<boolean> {
  const list = await prisma.taskList.findUnique({ where: { id: listId } });
  if (!list) return false;
  if (list.userId === userId) return true;
  const share = await prisma.taskListShare.findFirst({
    where: { taskListId: listId, userId, permission: SharePermission.EDIT }
  });
  return !!share;
}

export const createTaskList = async (req: AuthRequest, res: Response) => {
  const listData = new TaskListDto();
  Object.assign(listData, req.body);

  const errors = await validate(listData);
  if (errors.length > 0) return res.status(400).json(errors);

  const newList = await prisma.taskList.create({
    data: {
      name: listData.name,
      pinned: listData.pinned || false,
      userId: req.user.userId
    }
  });

  return res.status(201).json(newList);
};

export const getTaskLists = async (req: AuthRequest, res: Response) => {
  const lists = await prisma.taskList.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ]
    },
    include: {
      tasks: true,
      shares: {
        where: { userId: req.user.userId },
        select: {
          permission: true,
          sharedBy: { select: { email: true, id: true } }
        }
      },
      user: { select: { email: true, id: true } }
    }
  });
  return res.status(200).json(lists);
};

export const updateTaskList = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) return res.status(403).json({ message: 'No tienes permiso para editar esta lista' });

  const listData = new TaskListDto();
  Object.assign(listData, req.body);

  const errors = await validate(listData);
  if (errors.length > 0) return res.status(400).json(errors);

  const updated = await prisma.taskList.update({
    where: { id: listId },
    data: {
      name: listData.name,
      pinned: listData.pinned
    }
  });

  return res.status(200).json(updated);
};

export const deleteTaskList = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  const list = await prisma.taskList.findUnique({ where: { id: listId } });
  if (!list) return res.status(404).json({ message: 'Lista no encontrada' });
  if (list.userId !== req.user.userId) return res.status(403).json({ message: 'No tienes permiso para eliminar esta lista' });

  await prisma.taskListShare.deleteMany({ where: { taskListId: listId } });
  await prisma.task.deleteMany({ where: { listId } });
  await prisma.taskList.delete({ where: { id: listId } });

  return res.status(200).json({ message: 'Lista eliminada' });
};

export const shareTaskList = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  const list = await prisma.taskList.findUnique({ where: { id: listId } });
  if (!list) return res.status(404).json({ message: 'Lista no encontrada' });
  if (list.userId !== req.user.userId) return res.status(403).json({ message: 'No tienes permiso para compartir esta lista' });

  const shareItems: ShareItemDto[] = req.body.shareItems;
  if (!Array.isArray(shareItems)) return res.status(400).json({ message: 'Debe proporcionar un array en shareItems' });

  for (const si of shareItems) {
    const validationErrors = await validate(si);
    if (validationErrors.length > 0) return res.status(400).json(validationErrors);
  }

  const emails = shareItems.map(si => si.email);
  const users = await prisma.user.findMany({ where: { email: { in: emails } } });

  for (const si of shareItems) {
    const user = users.find(u => u.email === si.email);
    if (!user) return res.status(404).json({ message: `Usuario ${si.email} no encontrado` });

    await prisma.taskListShare.upsert({
      where: {
        taskListId_userId: {
          taskListId: listId,
          userId: user.id
        }
      },
      update: { permission: si.permission },
      create: {
        taskListId: listId,
        userId: user.id,
        permission: si.permission,
        sharedById: req.user.userId
      }
    });
  }

  return res.status(200).json({ message: 'Lista compartida correctamente' });
};

export const getTaskListShares = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  try {
    const shares = await prisma.taskListShare.findMany({
      where: { taskListId: listId },
      include: {
        user: { select: { id: true, email: true } },
        sharedBy: { select: { id: true, email: true } }
      }
    });
    const formattedShares = shares.map(share => ({
      id: share.user.id,
      email: share.user.email,
      permission: share.permission,
      compartidoPor: share.sharedBy.email
    }));
    return res.status(200).json(formattedShares);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener usuarios compartidos' });
  }
};

export const revokeTaskListShare = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  try {
    await prisma.taskListShare.delete({
      where: { taskListId_userId: { taskListId: listId, userId } }
    });
    return res.status(200).json({ message: 'Acceso revocado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al revocar acceso compartido' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.listId);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) return res.status(403).json({ message: 'No tienes permiso para editar esta lista' });

  const taskData = new TaskDto();
  Object.assign(taskData, req.body);

  const errors = await validate(taskData);
  if (errors.length > 0) return res.status(400).json(errors);

  const newTask = await prisma.task.create({
    data: {
      title: taskData.title,
      description: taskData.description,
      completed: taskData.completed || false,
      starred: taskData.starred || false,
      listId
    }
  });

  return res.status(201).json(newTask);
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.listId);
  const taskId = parseInt(req.params.taskId);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) return res.status(403).json({ message: 'No tienes permiso para editar esta lista o sus tareas' });

  const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existingTask || existingTask.listId !== listId) return res.status(404).json({ message: 'Tarea no encontrada en esta lista' });

  const data: Partial<{ title: string; description?: string; completed: boolean; starred: boolean }> = {};
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.completed !== undefined) data.completed = req.body.completed;
  if (req.body.starred !== undefined) data.starred = req.body.starred;

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data
  });

  return res.status(200).json(updatedTask);
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.listId);
  const taskId = parseInt(req.params.taskId);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) return res.status(403).json({ message: 'No tienes permiso para editar esta lista o sus tareas' });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.listId !== listId) return res.status(404).json({ message: 'Tarea no encontrada en esta lista' });

  await prisma.task.delete({ where: { id: taskId } });
  return res.status(200).json({ message: 'Tarea eliminada' });
};
