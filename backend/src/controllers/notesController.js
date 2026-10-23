import * as notesService from '../services/notesService.js';

export async function createNote(req, res) {
  try {
    const { subjectId } = req.params;
    const { title, content } = req.body;

    const note = await notesService.createNoteForSubject({
      subjectId,
      title,
      content
    });

    return res.status(201).json({ success: true, note });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function listNotes(req, res) {
  try {
    const { subjectId } = req.params;
    const notes = await notesService.getNotesBySubject(subjectId);

    return res.status(200).json({ success: true, notes });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}