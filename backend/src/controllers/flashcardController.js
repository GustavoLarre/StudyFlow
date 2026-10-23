import * as flashcardService from '../services/flashcardService.js';

export async function createManual(req, res) {
  try {
    const { noteId } = req.params;
    const { front, back } = req.body;

    const flashcard = await flashcardService.createManualFlashcard({
      noteId,
      front,
      back
    });

    return res.status(201).json({ success: true, flashcard });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function review(req, res) {
  try {
    const { flashcardId } = req.params;
    const { rating } = req.body;

    const result = await flashcardService.reviewFlashcard(flashcardId, rating);

    return res.status(200).json({
      success: true,
      ...result // Espalha { flashcard, gamification } diretamente na raiz do JSON de resposta
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function getDue(req, res) {
  try {
    const flashcards = await flashcardService.getDueFlashcards();
    return res.status(200).json({ success: true, flashcards });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}