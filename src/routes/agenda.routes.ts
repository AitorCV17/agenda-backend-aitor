import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth.middleware'
import {
  createEvent,
  getEvents,
  getCalendarEvents
} from '../controllers/agenda.controller'
import {
  updateEvent,
  deleteEvent,
  shareEvent
} from '../controllers/event.controller'

const router = Router()
router.use(authenticateJWT)

router.post('/', createEvent)
router.get('/', getEvents)
router.get('/calendar', getCalendarEvents)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)
router.post('/:id/share', shareEvent)

export default router
