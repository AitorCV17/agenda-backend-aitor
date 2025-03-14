import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { validate } from 'class-validator';
import { UpdateProfileDto, UpdatePasswordDto, UpdateCompleteProfileDto } from '../dto/user.dto';
import { hashPassword, comparePassword } from '../utils/hash';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  return res.status(200).json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const profileData = new UpdateProfileDto();
  profileData.name = req.body.name;
  profileData.email = req.body.email;

  const errors = await validate(profileData);
  if (errors.length > 0) return res.status(400).json(errors);

  const updatedUser = await prisma.user.update({
    where: { id: req.user.userId },
    data: { name: profileData.name, email: profileData.email }
  });

  return res.status(200).json({ message: 'Perfil actualizado', user: updatedUser });
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  const passwordData = new UpdatePasswordDto();
  passwordData.currentPassword = req.body.currentPassword;
  passwordData.newPassword = req.body.newPassword;

  const errors = await validate(passwordData);
  if (errors.length > 0) return res.status(400).json(errors);

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const isValid = await comparePassword(passwordData.currentPassword, user.password);
  if (!isValid) return res.status(400).json({ message: 'La contraseña actual es incorrecta' });

  const newHashed = await hashPassword(passwordData.newPassword);
  await prisma.user.update({
    where: { id: req.user.userId },
    data: { password: newHashed }
  });

  return res.status(200).json({ message: 'Contraseña actualizada' });
};

export const updateCompleteProfile = async (req: AuthRequest, res: Response) => {
  const data = new UpdateCompleteProfileDto();
  data.name = req.body.name;
  data.email = req.body.email;
  data.currentPassword = req.body.currentPassword?.trim() || undefined;
  data.newPassword = req.body.newPassword?.trim() || undefined;

  const errors = await validate(data);
  if (errors.length > 0) return res.status(400).json(errors);

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const updateData: any = { name: data.name, email: data.email };

  if (data.newPassword) {
    const isValid = await comparePassword(data.currentPassword!, user.password);
    if (!isValid) return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    updateData.password = await hashPassword(data.newPassword);
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.userId },
    data: updateData
  });

  return res.status(200).json({ message: 'Perfil actualizado', user: updatedUser });
};
