import {
  createNoteDb,
  getNotesBySubjectDb,
  getNoteByIdDb,
  updateNoteDb,
  deleteNoteDb
} from '../repositories/noteRepository.js';
import { getSubjectByIdDb } from '../repositories/subjectRepository.js';
import { createManyFlashcardsDb } from '../repositories/flashcardRepository.js';
import { generateFlashcardsFromText } from './aiClient.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';

export const MAX_NOTE_CHARS = 6000;
const MAX_TITLE_LENGTH = 150;
const DEFAULT_TITLE = 'Nota sem título';

function normalizeContent(content) {
  if (typeof content !== 'string' || content.trim() === '') {
    throw new ValidationError('Conteúdo da nota é obrigatório.');
  }

  if (content.length > MAX_NOTE_CHARS) {
    throw new ValidationError(`A nota ultrapassou o limite máximo de ${MAX_NOTE_CHARS} caracteres.`);
  }

  return content;
}

function normalizeTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('O título da nota não pode ser vazio.');
  }

  const trimmed = title.trim();
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`O título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.`);
  }

  return trimmed;
}

async function getOwnedSubject(userId, subjectId) {
  const subject = await getSubjectByIdDb(subjectId);

  if (!subject || subject.userId !== userId) {
    throw new NotFoundError('Matéria não encontrada.');
  }

  return subject;
}

async function getOwnedNote(userId, noteId) {
  const note = await getNoteByIdDb(noteId);

  // Inexistente e de outro usuário respondem igual: não vaza que o ID existe
  if (!note || note.userId !== userId) {
    throw new NotFoundError('Nota não encontrada.');
  }

  return note;
}

export async function createNote({ userId, subjectId, title, content }) {
  const normalizedContent = normalizeContent(content);
  const normalizedTitle = title === undefined || title === null ? DEFAULT_TITLE : normalizeTitle(title);

  await getOwnedSubject(userId, subjectId);

  const now = new Date().toISOString();

  return await createNoteDb({
    userId,
    subjectId,
    title: normalizedTitle,
    content: normalizedContent,
    createdAt: now,
    updatedAt: now
  });
}

export async function listNotes({ userId, subjectId }) {
  await getOwnedSubject(userId, subjectId);
  return await getNotesBySubjectDb(subjectId);
}

export async function getNote({ userId, noteId }) {
  return await getOwnedNote(userId, noteId);
}

export async function updateNote({ userId, noteId, title, content }) {
  const changes = {};

  if (title !== undefined) {
    changes.title = normalizeTitle(title);
  }
  if (content !== undefined) {
    changes.content = normalizeContent(content);
  }

  if (Object.keys(changes).length === 0) {
    throw new ValidationError('Informe o título ou o conteúdo para atualizar.');
  }

  await getOwnedNote(userId, noteId);

  return await updateNoteDb(noteId, { ...changes, updatedAt: new Date().toISOString() });
}

export async function deleteNote({ userId, noteId }) {
  await getOwnedNote(userId, noteId);
  await deleteNoteDb(noteId);
}

/**
 * Comportamento atual da geração por IA. Será refeito na Fase 6
 * (userId, cota, source: 'ai', rating inicial e nota intocada).
 */
export async function generateFlashcardsForNote(subjectId, noteInput) {
  if (!noteInput || !noteInput.content) {
    throw new Error('Conteúdo da nota é obrigatório.');
  }

  if (noteInput.content.length > MAX_NOTE_CHARS) {
    throw new Error(`A nota ultrapassou o limite máximo de ${MAX_NOTE_CHARS} caracteres.`);
  }

  const targetNoteId = noteInput.noteId;

  const generatedCardsRaw = await generateFlashcardsFromText(noteInput.title, noteInput.content);

  const cardsList = Array.isArray(generatedCardsRaw)
    ? generatedCardsRaw
    : (generatedCardsRaw?.flashcards || []);

  if (cardsList.length === 0) {
    throw new Error('A IA não retornou nenhum flashcard válido.');
  }

  const flashcardsToInsert = cardsList.map(card => ({
    noteId: targetNoteId,
    subjectId,
    front: card.front,
    back: card.back,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString()
  }));

  const savedFlashcards = await createManyFlashcardsDb(flashcardsToInsert);

  return {
    ...noteInput,
    flashcards: savedFlashcards
  };
}