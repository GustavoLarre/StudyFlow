import { Router } from 'express';
import * as subjectController from '../controllers/subjectController.js';

const router = Router();

router.post('/', subjectController.create);
router.get('/', subjectController.list);
router.get('/:id', subjectController.get);
router.put('/:id', subjectController.update);
router.delete('/:id', subjectController.remove);

export default router;