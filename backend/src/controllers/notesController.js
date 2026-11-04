import * as notesService from '../services/notesService.js';
import { handleError } from '../errors/handleError.js';

export async function createNote(req, res) {
  try {
    const note = await notesService.createNote({
      userId: req.user.uid,
      subjectId: req.params.subjectId,
      title: req.body?.title,
      content: req.body?.content
    });
    return res.status(201).json({ success: true, note });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listNotes(req, res) {
  try {
    const notes = await notesService.listNotes({
      userId: req.user.uid,
      subjectId: req.params.subjectId
    });
    return res.status(200).json({ success: true, notes });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getNote(req, res) {
  try {
    const note = await notesService.getNote({
      userId: req.user.uid,
      noteId: req.params.id
    });
    return res.status(200).json({ success: true, note });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateNote(req, res) {
  try {
    const note = await notesService.updateNote({
      userId: req.user.uid,
      noteId: req.params.id,
      title: req.body?.title,
      content: req.body?.content
    });
    return res.status(200).json({ success: true, note });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteNote(req, res) {
  try {
    await notesService.deleteNote({
      userId: req.user.uid,
      noteId: req.params.id
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function generateFlashcards(req, res) {
  try {
    const { flashcards, gamification, usage } = await notesService.generateFlashcardsForNote({
      userId: req.user.uid,
      noteId: req.params.id
    });
    return res.status(201).json({ success: true, flashcards, gamification, usage });
  } catch (error) {
    return handleError(res, error);
  }
}