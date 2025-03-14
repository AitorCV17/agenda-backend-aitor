import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
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
} from '../controllers/event.controller';

const router = Router();
router.use(authenticateJWT);

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/calendar', getCalendarEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/share', shareEvent);
router.get('/:id/shares', getEventShares);
router.delete('/:id/share/:userId', revokeShare);

export default router;
