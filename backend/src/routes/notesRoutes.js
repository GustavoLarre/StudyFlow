import { Router } from 'express';
import { generateFlashcardsForNote } from '../services/notesService.js';

const router = Router();

/**
 * POST /notes/:noteId/generate-flashcards
 * Dispara a conversão de uma nota em flashcards via IA.
 */
router.post('/:noteId/generate-flashcards', async (req, res) => {
  try {
    const { noteId } = req.params;

    // Nota simulada/mockada por enquanto antes de ligar o Firestore real.
    // Futuramente, buscaremos o { title, content } diretamente do Firestore usando o noteId.
    const mockFetchedNote = {
      title: 'Nota de Estudo',
      content: 'Conteúdo da nota recuperado do banco de dados.'
    };

    const flashcards = await generateFlashcardsForNote(noteId, mockFetchedNote);

    return res.status(201).json({
      success: true,
      count: flashcards.length,
      flashcards
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;