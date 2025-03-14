import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  shareNote
} from '../controllers/note.controller';

const router = Router();
router.use(authenticateJWT);

router.post('/', createNote);
router.get('/', getNotes);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/share', shareNote);

export default router;
