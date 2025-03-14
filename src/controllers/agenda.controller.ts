import { Request, Response } from 'express'
import { Recurrence } from '@prisma/client'
import { validate } from 'class-validator'
import { EventDto } from '../dto/event.dto'
import { AuthRequest } from '../middlewares/auth.middleware'
import prisma from '../utils/prisma'

export const createEvent = async (req: AuthRequest, res: Response) => {
  const eventData = new EventDto()
  eventData.title = req.body.title
  eventData.description = req.body.description
  eventData.startTime = req.body.startTime
  eventData.endTime = req.body.endTime
  eventData.color = req.body.color
  eventData.reminderOffset = req.body.reminderOffset
  eventData.recurrence = req.body.recurrence ? (req.body.recurrence as Recurrence) : undefined

  const errors = await validate(eventData)
  if (errors.length > 0) return res.status(400).json(errors)

  if (new Date(eventData.startTime) >= new Date(eventData.endTime))
    return res.status(400).json({ message: 'La fecha/hora de fin debe ser posterior a la de inicio' })

  const event = await prisma.event.create({
    data: {
      title: eventData.title,
      description: eventData.description,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      color: eventData.color,
      reminderOffset: eventData.reminderOffset || null,
      recurrence: eventData.recurrence || undefined,
      userId: req.user.userId
    }
  })

  return res.status(201).json(event)
}

export const getEvents = async (req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ]
    }
  })
  return res.status(200).json(events)
}

export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  const { start, end } = req.query
  if (!start || !end)
    return res.status(400).json({ message: 'Debe proporcionar start y end en formato ISO' })

  const startDate = new Date(start as string)
  const endDate = new Date(end as string)

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ],
      startTime: { lte: endDate },
      endTime: { gte: startDate }
    }
  })
  return res.status(200).json(events)
}
