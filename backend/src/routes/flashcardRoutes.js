import { Router } from 'express';
import * as flashcardController from '../controllers/flashcardController.js';

const router = Router();

// Rota para buscar flashcards vencidos para revisão do dia
router.get('/review/due', flashcardController.getDue);

// Rota para criar flashcard manual vinculado a uma nota
router.post('/notes/:noteId/flashcards', flashcardController.createManual);

// Rota para registrar a revisão de um flashcard
router.post('/flashcards/:flashcardId/review', flashcardController.review);

export default router;