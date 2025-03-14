import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const notesCount = await prisma.note.count({ where: { userId } });
    const eventsCount = await prisma.event.count({ where: { userId } });
    const taskListsCount = await prisma.taskList.count({ where: { userId } });
    const tasksCount = await prisma.task.count({
      where: { list: { userId } }
    });

    return res.status(200).json({
      notes: notesCount,
      events: eventsCount,
      taskLists: taskListsCount,
      tasks: tasksCount
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
};
