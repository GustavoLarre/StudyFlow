import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';

const router = Router();

router.get('/review/due', reviewController.due);
router.post('/flashcards/:id/review', reviewController.review);

export default router;