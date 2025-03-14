import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth.middleware'
import { getProfile, updateProfile, updatePassword } from '../controllers/user.controller'

const router = Router()
router.use(authenticateJWT)

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.put('/profile/password', updatePassword)

export default router
