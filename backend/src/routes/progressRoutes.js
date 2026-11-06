import { Router } from 'express';
import * as progressController from '../controllers/progressController.js';

const router = Router();

router.get('/', progressController.getProgress);

export default router;