import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { getDashboardData } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', authenticateJWT, getDashboardData);

export default router;
