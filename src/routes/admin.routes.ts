import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth.middleware'
import { authorizeRoles } from '../middlewares/role.middleware'
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/admin.controller'

const router = Router()
router.use(authenticateJWT)
router.use(authorizeRoles('ADMIN'))

router.get('/users', getAllUsers)
router.post('/users', createUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

export default router
