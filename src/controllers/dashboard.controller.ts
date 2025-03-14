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

    const lastEvent = await prisma.event.findFirst({
      where: { userId },
      orderBy: { id: 'desc' }
    });
    const lastNote = await prisma.note.findFirst({
      where: { userId },
      orderBy: { id: 'desc' }
    });
    const lastTaskList = await prisma.taskList.findFirst({
      where: { userId },
      orderBy: { id: 'desc' }
    });
    const lastTask = await prisma.task.findFirst({
      where: { list: { userId } },
      orderBy: { id: 'desc' }
    });

    const upcomingEvents = await prisma.event.findMany({
      where: {
        userId,
        startTime: { gte: new Date() }
      },
      orderBy: { startTime: 'asc' },
      take: 5
    });

    return res.status(200).json({
      counts: { notes: notesCount, events: eventsCount, taskLists: taskListsCount, tasks: tasksCount },
      lastCreated: { event: lastEvent, note: lastNote, taskList: lastTaskList, task: lastTask },
      upcomingEvents
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
};
