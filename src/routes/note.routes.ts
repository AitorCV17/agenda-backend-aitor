import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  shareNote,
  getNoteShares,
  revokeNoteShare
} from '../controllers/note.controller';

const router = Router();

router.use(authenticateJWT);

router.post('/', createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/share', shareNote);
router.get('/:id/shares', getNoteShares);
router.delete('/:id/share/:userId', revokeNoteShare);

export default router;
