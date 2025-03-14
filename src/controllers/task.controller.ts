import { Request, Response } from 'express';
import { PrismaClient, SharePermission } from '@prisma/client';
import { validate } from 'class-validator';
import { TaskListDto, TaskDto } from '../dto/task.dto';
import { ShareItemDto } from '../dto/share.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

async function canEditList(userId: number, listId: number): Promise<boolean> {
  const list = await prisma.taskList.findUnique({ where: { id: listId } });
  if (!list) return false;
  if (list.userId === userId) return true;

  const share = await prisma.taskListShare.findFirst({
    where: { taskListId: listId, userId, permission: SharePermission.EDIT }
  });
  return !!share;
}

// Crear lista de tareas
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

// Obtener todas las listas de tareas
export const getTaskLists = async (req: AuthRequest, res: Response) => {
  const lists = await prisma.taskList.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ]
    },
    include: { tasks: true }
  });
  return res.status(200).json(lists);
};

// Actualizar una lista de tareas
export const updateTaskList = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) {
    return res.status(403).json({ message: 'No tienes permiso para editar esta lista' });
  }

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

// Eliminar lista de tareas (y sus tareas asociadas)
export const deleteTaskList = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  const list = await prisma.taskList.findUnique({ where: { id: listId } });
  if (!list) return res.status(404).json({ message: 'Lista no encontrada' });
  if (list.userId !== req.user.userId) {
    return res.status(403).json({ message: 'No tienes permiso para eliminar esta lista' });
  }

  // Eliminar todas las tareas asociadas a la lista primero
  await prisma.task.deleteMany({ where: { listId } });

  // Luego eliminar la lista
  await prisma.taskList.delete({ where: { id: listId } });
  return res.status(200).json({ message: 'Lista eliminada' });
};

// Compartir la lista de tareas
export const shareTaskList = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.id);
  const list = await prisma.taskList.findUnique({ where: { id: listId } });
  if (!list) return res.status(404).json({ message: 'Lista no encontrada' });
  if (list.userId !== req.user.userId) {
    return res.status(403).json({ message: 'No tienes permiso para compartir esta lista' });
  }

  const shareItems: ShareItemDto[] = req.body.shareItems;
  if (!Array.isArray(shareItems)) {
    return res.status(400).json({ message: 'Debe proporcionar un array en shareItems' });
  }

  // Validar cada shareItem
  for (const si of shareItems) {
    const validationErrors = await validate(si);
    if (validationErrors.length > 0) {
      return res.status(400).json(validationErrors);
    }
  }

  // Buscar usuarios por email
  const emails = shareItems.map(si => si.email);
  const users = await prisma.user.findMany({ where: { email: { in: emails } } });

  for (const si of shareItems) {
    const user = users.find(u => u.email === si.email);
    if (!user) continue;
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
        permission: si.permission
      }
    });
  }

  return res.status(200).json({ message: 'Lista compartida correctamente' });
};

// Crear tarea dentro de una lista
export const createTask = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.listId);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) {
    return res.status(403).json({ message: 'No tienes permiso para editar esta lista' });
  }

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

// Actualizar tarea
export const updateTask = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.listId);
  const taskId = parseInt(req.params.taskId);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) {
    return res.status(403).json({ message: 'No tienes permiso para editar esta lista o sus tareas' });
  }

  const taskData = new TaskDto();
  Object.assign(taskData, req.body);

  const errors = await validate(taskData);
  if (errors.length > 0) return res.status(400).json(errors);

  // Verificar que la tarea pertenece a la lista
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.listId !== listId) {
    return res.status(404).json({ message: 'Tarea no encontrada en esta lista' });
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: taskData.title,
      description: taskData.description,
      completed: taskData.completed,
      starred: taskData.starred
    }
  });

  return res.status(200).json(updatedTask);
};

// Eliminar tarea
export const deleteTask = async (req: AuthRequest, res: Response) => {
  const listId = parseInt(req.params.listId);
  const taskId = parseInt(req.params.taskId);
  const canEdit = await canEditList(req.user.userId, listId);
  if (!canEdit) {
    return res.status(403).json({ message: 'No tienes permiso para editar esta lista o sus tareas' });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.listId !== listId) {
    return res.status(404).json({ message: 'Tarea no encontrada en esta lista' });
  }

  await prisma.task.delete({ where: { id: taskId } });
  return res.status(200).json({ message: 'Tarea eliminada' });
};
