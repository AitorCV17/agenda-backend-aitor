import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateCompleteProfile
} from '../controllers/user.controller';

const router = Router();

router.get('/profile', authenticateJWT, getProfile);
router.put('/profile', authenticateJWT, updateProfile);
router.put('/profile/password', authenticateJWT, updatePassword);
router.put('/profile/full', authenticateJWT, updateCompleteProfile);

export default router;
