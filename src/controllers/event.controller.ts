import { Request, Response } from 'express';
import { Recurrence, SharePermission } from '@prisma/client';
import { validate } from 'class-validator';
import prisma from '../utils/prisma';
import { EventDto } from '../dto/event.dto';
import { ShareItemDto } from '../dto/share.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

async function canEditEvent(userId: number, eventId: number): Promise<boolean> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return false;
  if (event.userId === userId) return true;
  const share = await prisma.eventShare.findFirst({
    where: { eventId, userId, permission: SharePermission.EDIT }
  });
  return !!share;
}

export const createEvent = async (req: AuthRequest, res: Response) => {
  const eventData = new EventDto();
  Object.assign(eventData, req.body);

  const errors = await validate(eventData);
  if (errors.length > 0) return res.status(400).json(errors);

  if (new Date(eventData.startTime) >= new Date(eventData.endTime))
    return res.status(400).json({ message: 'La fecha/hora de fin debe ser posterior a la de inicio' });

  const event = await prisma.event.create({
    data: {
      title: eventData.title,
      description: eventData.description,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      color: eventData.color,
      reminderOffset: eventData.reminderOffset || null,
      recurrence: eventData.recurrence || undefined,
      location: eventData.location || null,
      userId: req.user.userId
    }
  });

  return res.status(201).json(event);
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ]
    },
    include: {
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
  return res.status(200).json(events);
};

export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  const { start, end } = req.query;
  if (!start || !end)
    return res.status(400).json({ message: 'Debe proporcionar start y end en formato ISO' });

  const startDate = new Date(start as string);
  const endDate = new Date(end as string);

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ],
      startTime: { lte: endDate },
      endTime: { gte: startDate }
    },
    include: {
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
  return res.status(200).json(events);
};

export const getEventById = async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ]
    },
    include: {
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
  if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
  return res.status(200).json(event);
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const canEdit = await canEditEvent(req.user.userId, eventId);
  if (!canEdit)
    return res.status(403).json({ message: 'No tienes permiso para editar este evento' });

  const eventData = new EventDto();
  Object.assign(eventData, req.body);

  const errors = await validate(eventData);
  if (errors.length > 0) return res.status(400).json(errors);

  if (new Date(eventData.startTime) >= new Date(eventData.endTime))
    return res.status(400).json({ message: 'La fecha/hora de fin debe ser posterior a la de inicio' });

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: eventData.title,
      description: eventData.description,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      color: eventData.color,
      reminderOffset: eventData.reminderOffset || null,
      recurrence: eventData.recurrence || undefined,
      location: eventData.location || null
    }
  });

  return res.status(200).json(updated);
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
  if (event.userId !== req.user.userId)
    return res.status(403).json({ message: 'No tienes permiso para eliminar este evento' });

  await prisma.event.delete({ where: { id: eventId } });
  return res.status(200).json({ message: 'Evento eliminado' });
};

export const shareEvent = async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
  if (event.userId !== req.user.userId)
    return res.status(403).json({ message: 'No tienes permiso para compartir este evento' });

  const shareItems: ShareItemDto[] = req.body.shareItems;
  if (!Array.isArray(shareItems))
    return res.status(400).json({ message: 'Debe proporcionar un array en shareItems' });

  for (const item of shareItems) {
    const validationErrors = await validate(item);
    if (validationErrors.length > 0) return res.status(400).json(validationErrors);
  }

  for (const item of shareItems) {
    const user = await prisma.user.findUnique({ where: { email: item.email } });
    if (!user) return res.status(404).json({ message: `Usuario ${item.email} no encontrado` });

    await prisma.eventShare.upsert({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: user.id
        }
      },
      update: { permission: item.permission },
      create: {
        eventId: eventId,
        userId: user.id,
        permission: item.permission,
        sharedById: req.user.userId
      }
    });
  }

  return res.status(200).json({ message: 'Evento compartido correctamente' });
};

export const getEventShares = async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  try {
    const shares = await prisma.eventShare.findMany({
      where: { eventId },
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

export const revokeShare = async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  try {
    await prisma.eventShare.delete({
      where: { eventId_userId: { eventId, userId } }
    });
    return res.status(200).json({ message: 'Acceso revocado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al revocar acceso' });
  }
};
