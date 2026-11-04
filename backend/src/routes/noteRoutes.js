import { Router } from 'express';
import * as notesController from '../controllers/notesController.js';

const router = Router();

router.post('/subjects/:subjectId/notes', notesController.createNote);
router.get('/subjects/:subjectId/notes', notesController.listNotes);
router.get('/notes/:id', notesController.getNote);
router.put('/notes/:id', notesController.updateNote);
router.delete('/notes/:id', notesController.deleteNote);
router.post('/notes/:id/generate-flashcards', notesController.generateFlashcards);

export default router;