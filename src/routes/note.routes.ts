import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth.middleware'
import {
  createNote,
  getNotes,
  getNoteById,     // <-- Importamos la nueva función
  updateNote,
  deleteNote,
  shareNote
} from '../controllers/note.controller'

const router = Router()
router.use(authenticateJWT)

// Crear nota
router.post('/', createNote)

// Listar todas las notas (propias o compartidas)
router.get('/', getNotes)

// (NUEVO) Obtener una nota por su ID
router.get('/:id', getNoteById)

// Actualizar nota
router.put('/:id', updateNote)

// Eliminar nota
router.delete('/:id', deleteNote)

// Compartir nota
router.post('/:id/share', shareNote)

export default router
