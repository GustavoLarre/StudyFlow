import { Router } from 'express';
import * as notesController from '../controllers/notesController.js';
import { generateFlashcardsForNote } from '../services/notesService.js';
import { getNoteByIdDb } from '../repositories/noteRepository.js'; 

const router = Router();

// 1. Rotas de Notas por Matéria (Fase 1)
router.post('/subjects/:subjectId/notes', notesController.createNote);
router.get('/subjects/:subjectId/notes', notesController.listNotes);

/**
 * 2. Rota de Geração de Flashcards via IA (Fase 2)
 * POST /notes/:noteId/generate-flashcards
 */
router.post('/notes/:noteId/generate-flashcards', async (req, res) => {
  try {
    const { noteId } = req.params;

    // Busca a nota real no banco de dados usando o noteId da URL
    const noteFromDb = await getNoteByIdDb(noteId);

    if (!noteFromDb) {
      return res.status(404).json({
        success: false,
        error: 'Nota não encontrada no banco de dados.'
      });
    }

    // Passa o subjectId real da nota e o objeto dela para o serviço
    const result = await generateFlashcardsForNote(noteFromDb.subjectId, noteFromDb);

    return res.status(201).json({
      success: true,
      flashcards: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;