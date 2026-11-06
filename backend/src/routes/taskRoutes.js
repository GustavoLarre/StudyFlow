import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';

const router = Router();

router.post('/', taskController.create);
router.get('/', taskController.list);
router.put('/:id', taskController.update);
router.patch('/:id/complete', taskController.complete);
router.delete('/:id', taskController.remove);

export default router;