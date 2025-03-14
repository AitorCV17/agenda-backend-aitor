import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  createTaskList,
  getTaskLists,
  updateTaskList,
  deleteTaskList,
  shareTaskList,
  getTaskListShares,
  revokeTaskListShare,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/task.controller';

const router = Router();
router.use(authenticateJWT);

router.post('/lists', createTaskList);
router.get('/lists', getTaskLists);
router.put('/lists/:id', updateTaskList);
router.delete('/lists/:id', deleteTaskList);
router.post('/lists/:id/share', shareTaskList);
router.get('/lists/:id/shares', getTaskListShares);
router.delete('/lists/:id/share/:userId', revokeTaskListShare);

router.post('/lists/:listId/tasks', createTask);
router.put('/lists/:listId/tasks/:taskId', updateTask);
router.delete('/lists/:listId/tasks/:taskId', deleteTask);

export default router;
