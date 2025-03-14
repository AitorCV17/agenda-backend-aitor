import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import prisma from '../utils/prisma';

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: { events: true, notes: true, taskLists: true }
  });
  res.status(200).json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Faltan datos' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ message: 'Ya existe un usuario con ese email' });

  const hashed = await hashPassword(password);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role === 'ADMIN' ? Role.ADMIN : Role.USUARIO
    }
  });
  res.status(201).json({ message: 'Usuario creado', user: newUser });
};

export const updateUser = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const { name, email, password, role } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const dataToUpdate: any = {};
  if (name) dataToUpdate.name = name;
  if (email) dataToUpdate.email = email;
  if (role) dataToUpdate.role = role === 'ADMIN' ? Role.ADMIN : Role.USUARIO;
  if (password) {
    dataToUpdate.password = await hashPassword(password);
  }

  await prisma.user.update({ where: { id: userId }, data: dataToUpdate });
  res.status(200).json({ message: 'Usuario actualizado' });
};

export const deleteUser = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(400).json({ message: 'Error al eliminar el usuario' });
  }
};
