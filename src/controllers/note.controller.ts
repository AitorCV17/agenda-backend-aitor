import { Request, Response } from 'express';
import { PrismaClient, SharePermission } from '@prisma/client';
import { validate } from 'class-validator';
import { NoteDto } from '../dto/note.dto';
import { ShareItemDto } from '../dto/share.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

async function canEditNote(userId: number, noteId: number): Promise<boolean> {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) return false;
  if (note.userId === userId) return true;
  const share = await prisma.noteShare.findFirst({
    where: { noteId, userId, permission: SharePermission.EDIT }
  });
  return !!share;
}

export const createNote = async (req: AuthRequest, res: Response) => {
  const noteData = new NoteDto();
  Object.assign(noteData, req.body);
  const errors = await validate(noteData);
  if (errors.length > 0) return res.status(400).json(errors);
  const note = await prisma.note.create({
    data: {
      title: noteData.title,
      content: noteData.content,
      pinned: noteData.pinned || false,
      color: noteData.color,
      userId: req.user.userId
    }
  });
  return res.status(201).json(note);
};

export const getNotes = async (req: AuthRequest, res: Response) => {
  const notes = await prisma.note.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { shares: { some: { userId: req.user.userId } } }
      ]
    }
  });
  return res.status(200).json(notes);
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  const noteId = parseInt(req.params.id);
  const canEdit = await canEditNote(req.user.userId, noteId);
  if (!canEdit) return res.status(403).json({ message: 'No tienes permiso para editar esta nota' });
  const noteData = new NoteDto();
  Object.assign(noteData, req.body);
  const errors = await validate(noteData);
  if (errors.length > 0) return res.status(400).json(errors);
  const updated = await prisma.note.update({
    where: { id: noteId },
    data: {
      title: noteData.title,
      content: noteData.content,
      pinned: noteData.pinned,
      color: noteData.color
    }
  });
  return res.status(200).json(updated);
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  const noteId = parseInt(req.params.id);
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) return res.status(404).json({ message: 'Nota no encontrada' });
  if (note.userId !== req.user.userId)
    return res.status(403).json({ message: 'No tienes permiso para eliminar esta nota' });
  await prisma.note.delete({ where: { id: noteId } });
  return res.status(200).json({ message: 'Nota eliminada' });
};

export const shareNote = async (req: AuthRequest, res: Response) => {
  const noteId = parseInt(req.params.id);
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) return res.status(404).json({ message: 'Nota no encontrada' });
  if (note.userId !== req.user.userId)
    return res.status(403).json({ message: 'No tienes permiso para compartir esta nota' });
  const shareItems: ShareItemDto[] = req.body.shareItems;
  if (!Array.isArray(shareItems))
    return res.status(400).json({ message: 'Debe proporcionar un array en shareItems' });
  for (const si of shareItems) {
    const validationErrors = await validate(si);
    if (validationErrors.length > 0) return res.status(400).json(validationErrors);
  }
  const emails = shareItems.map(si => si.email);
  const users = await prisma.user.findMany({ where: { email: { in: emails } } });
  for (const si of shareItems) {
    const user = users.find(u => u.email === si.email);
    if (!user) continue;
    await prisma.noteShare.upsert({
      where: { noteId_userId: { noteId: noteId, userId: user.id } },
      update: { permission: si.permission },
      create: { noteId: noteId, userId: user.id, permission: si.permission }
    });
  }
  return res.status(200).json({ message: 'Nota compartida correctamente' });
};
