// src/routes/event.routes.ts
import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth.middleware'
import { 
  createEvent, 
  getEvents, 
  getCalendarEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent, 
  shareEvent, 
  getEventShares, 
  revokeShare 
} from '../controllers/event.controller'

const router = Router()
router.use(authenticateJWT)

// Crear evento
router.post('/', createEvent)
// Listar eventos
router.get('/', getEvents)
// Obtener eventos para calendario
router.get('/calendar', getCalendarEvents)
// Obtener un evento por ID
router.get('/:id', getEventById)
// Actualizar evento
router.put('/:id', updateEvent)
// Eliminar evento
router.delete('/:id', deleteEvent)
// Compartir evento
router.post('/:id/share', shareEvent)
// Obtener usuarios compartidos
router.get('/:id/shares', getEventShares)
// Revocar acceso compartido
router.delete('/:id/share/:userId', revokeShare)

export default router
