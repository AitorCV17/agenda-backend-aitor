import { Request, Response } from 'express'
import { validate } from 'class-validator'
import prisma from '../utils/prisma'
import jwt from 'jsonwebtoken'
import { hashPassword, comparePassword } from '../utils/hash'
import { RegisterDto, LoginDto } from '../dto/user.dto'

export const register = async (req: Request, res: Response) => {
  const registerData = new RegisterDto()
  registerData.name = req.body.name
  registerData.email = req.body.email
  registerData.password = req.body.password

  const errors = await validate(registerData)
  if (errors.length > 0) return res.status(400).json(errors)

  const existingUser = await prisma.user.findUnique({ where: { email: registerData.email } })
  if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' })

  const hashedPassword = await hashPassword(registerData.password)
  const user = await prisma.user.create({
    data: {
      name: registerData.name,
      email: registerData.email,
      password: hashedPassword
    }
  })

  return res.status(201).json({ message: 'Usuario creado', userId: user.id })
}

export const login = async (req: Request, res: Response) => {
  const loginData = new LoginDto()
  loginData.email = req.body.email
  loginData.password = req.body.password

  const errors = await validate(loginData)
  if (errors.length > 0) return res.status(400).json(errors)

  const user = await prisma.user.findUnique({ where: { email: loginData.email } })
  if (!user) return res.status(400).json({ message: 'Usuario no registrado' })

  const isPasswordValid = await comparePassword(loginData.password, user.password)
  if (!isPasswordValid) return res.status(400).json({ message: 'Credenciales inválidas' })

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '2h' }
  )

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
}
