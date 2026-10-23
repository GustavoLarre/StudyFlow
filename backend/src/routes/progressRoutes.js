import { Router } from 'express';
import { getGeneralProgress } from '../controllers/progressController.js';

const router = Router();
router.get('/', getGeneralProgress);

export default router;