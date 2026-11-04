import { Router } from 'express';
import * as flashcardController from '../controllers/flashcardController.js';

const router = Router();

router.post('/subjects/:subjectId/flashcards', flashcardController.create);
router.get('/subjects/:subjectId/flashcards', flashcardController.list);
router.get('/flashcards/:id', flashcardController.get);
router.put('/flashcards/:id', flashcardController.update);
router.delete('/flashcards/:id', flashcardController.remove);

export default router;