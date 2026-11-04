import * as flashcardService from '../services/flashcardService.js';
import { handleError } from '../errors/handleError.js';

export async function create(req, res) {
  try {
    const { flashcard, gamification } = await flashcardService.createFlashcard({
      userId: req.user.uid,
      subjectId: req.params.subjectId,
      noteId: req.body?.noteId,
      front: req.body?.front,
      back: req.body?.back
    });
    return res.status(201).json({ success: true, flashcard, gamification });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function list(req, res) {
  try {
    const flashcards = await flashcardService.listFlashcards({
      userId: req.user.uid,
      subjectId: req.params.subjectId
    });
    return res.status(200).json({ success: true, flashcards });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function get(req, res) {
  try {
    const flashcard = await flashcardService.getFlashcard({
      userId: req.user.uid,
      flashcardId: req.params.id
    });
    return res.status(200).json({ success: true, flashcard });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req, res) {
  try {
    const flashcard = await flashcardService.updateFlashcard({
      userId: req.user.uid,
      flashcardId: req.params.id,
      front: req.body?.front,
      back: req.body?.back
    });
    return res.status(200).json({ success: true, flashcard });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req, res) {
  try {
    await flashcardService.deleteFlashcard({
      userId: req.user.uid,
      flashcardId: req.params.id
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}