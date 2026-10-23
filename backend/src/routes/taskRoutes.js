import { Router } from 'express';
import { createTask, listTasks, completeTask } from '../controllers/taskController.js';

const router = Router();

router.post('/', createTask);
router.get('/', listTasks);
router.patch('/:taskId/complete', completeTask);

export default router;