import * as reviewService from '../services/reviewService.js';
import { handleError } from '../errors/handleError.js';

export async function review(req, res) {
  try {
    const { flashcard, gamification } = await reviewService.reviewFlashcard({
      userId: req.user.uid,
      flashcardId: req.params.id,
      action: req.body?.action
    });
    return res.status(200).json({ success: true, flashcard, gamification });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function due(req, res) {
  try {
    const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
    const { flashcards, total } = await reviewService.getDueFlashcards({
      userId: req.user.uid,
      subjectId
    });
    return res.status(200).json({ success: true, flashcards, total });
  } catch (error) {
    return handleError(res, error);
  }
}