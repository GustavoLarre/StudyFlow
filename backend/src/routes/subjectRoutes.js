import { Router } from 'express';
import * as subjectController from '../controllers/subjectController.js';

const router = Router();

router.post('/', subjectController.create);
router.get('/', subjectController.list);

export default router;