import {
  createNoteDb,
  getNotesBySubjectDb,
  getNoteByIdDb,
  updateNoteDb,
  deleteNoteDb
} from '../repositories/noteRepository.js';
import { getSubjectByIdDb } from '../repositories/subjectRepository.js';
import { createManyFlashcardsDb } from '../repositories/flashcardRepository.js';
import {
  getUserByUidDb,
  updateUserDb,
  reserveAiGeneration,
  releaseAiGeneration
} from '../repositories/userRepository.js';
import { generateFlashcardsFromText } from './aiClient.js';
import { addXp } from './gamificationService.js';
import { buildNewFlashcard, FLASHCARD_SOURCES } from '../config/flashcards.js';
import { getPlanLimits } from '../config/plans.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';

export const MAX_NOTE_CHARS = 6000;
const MAX_TITLE_LENGTH = 150;
const DEFAULT_TITLE = 'Nota sem título';
const AI_LOCK_MS = (Number(process.env.AI_SERVICE_TIMEOUT_MS) || 120000) + 15000;
const XP_PER_CREATED_CARD = 1;

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

async function grantXp(userId, amount) {
  try {
    const user = await getUserByUidDb(userId);
    const updated = addXp(user, amount);
    await updateUserDb(userId, { xp: updated.xp, level: updated.level });
    return { gainedXp: amount, totalXp: updated.xp, level: updated.level };
  } catch (error) {
    console.error('Falha ao gravar XP:', error.message);
    return null;
  }
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

export async function generateFlashcardsForNote({ userId, noteId }) {
  const note = await getOwnedNote(userId, noteId);

  const user = await getUserByUidDb(userId);
  const { limit } = getPlanLimits(user?.plan).aiGenerations;

  // 403 (limite do plano) ou 409 (já há uma geração em andamento)
  const usage = await reserveAiGeneration(userId, { limit, lockMs: AI_LOCK_MS });

  let saved;
  try {
    // A nota é só fonte: somente título e conteúdo saem daqui
    const generated = await generateFlashcardsFromText(note.title, note.content);

    saved = await createManyFlashcardsDb(
      generated.map((card) =>
        buildNewFlashcard({
          userId,
          subjectId: note.subjectId,
          noteId: note.noteId,
          source: FLASHCARD_SOURCES.AI,
          front: card.front,
          back: card.back
        })
      )
    );
  } catch (error) {
    await releaseAiGeneration(userId, { refund: true });
    throw error;
  }

  await releaseAiGeneration(userId, { refund: false });
  const gamification = await grantXp(userId, saved.length * XP_PER_CREATED_CARD);

  return { flashcards: saved, gamification, usage };
}