import {
  createFlashcardDb,
  getFlashcardsBySubjectDb,
  getFlashcardByIdDb,
  updateFlashcardDb,
  deleteFlashcardDb
} from '../repositories/flashcardRepository.js';
import { getSubjectByIdDb } from '../repositories/subjectRepository.js';
import { getNoteByIdDb } from '../repositories/noteRepository.js';
import { getUserByUidDb, updateUserDb } from '../repositories/userRepository.js';
import { buildNewFlashcard, FLASHCARD_SOURCES } from '../config/flashcards.js';
import { addXp } from './gamificationService.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';

export const MAX_CARD_TEXT = 500;
const XP_PER_CREATED_CARD = 1;

function normalizeText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`O campo ${label} é obrigatório.`);
  }

  const trimmed = value.trim();
  if (trimmed.length > MAX_CARD_TEXT) {
    throw new ValidationError(`O campo ${label} deve ter no máximo ${MAX_CARD_TEXT} caracteres.`);
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

async function getOwnedFlashcard(userId, flashcardId) {
  const card = await getFlashcardByIdDb(flashcardId);
  // Inexistente e de outro usuário respondem igual: não vaza que o ID existe
  if (!card || card.userId !== userId) {
    throw new NotFoundError('Flashcard não encontrado.');
  }
  return card;
}

async function assertNoteBelongs(userId, subjectId, noteId) {
  const note = await getNoteByIdDb(noteId);
  if (!note || note.userId !== userId || note.subjectId !== subjectId) {
    throw new NotFoundError('Nota não encontrada.');
  }
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

export async function createFlashcard({ userId, subjectId, noteId = null, front, back }) {
  const normalizedFront = normalizeText(front, 'front');
  const normalizedBack = normalizeText(back, 'back');

  await getOwnedSubject(userId, subjectId);
  if (noteId) {
    await assertNoteBelongs(userId, subjectId, noteId);
  }

  const flashcard = await createFlashcardDb(
    buildNewFlashcard({
      userId,
      subjectId,
      noteId: noteId || null,
      source: FLASHCARD_SOURCES.MANUAL,
      front: normalizedFront,
      back: normalizedBack
    })
  );

  const gamification = await grantXp(userId, XP_PER_CREATED_CARD);

  return { flashcard, gamification };
}

export async function listFlashcards({ userId, subjectId }) {
  await getOwnedSubject(userId, subjectId);
  return await getFlashcardsBySubjectDb(subjectId);
}

export async function getFlashcard({ userId, flashcardId }) {
  return await getOwnedFlashcard(userId, flashcardId);
}

export async function updateFlashcard({ userId, flashcardId, front, back }) {
  const changes = {};
  if (front !== undefined) changes.front = normalizeText(front, 'front');
  if (back !== undefined) changes.back = normalizeText(back, 'back');

  if (Object.keys(changes).length === 0) {
    throw new ValidationError('Informe front ou back para atualizar.');
  }

  await getOwnedFlashcard(userId, flashcardId);

  return await updateFlashcardDb(flashcardId, { ...changes, updatedAt: new Date().toISOString() });
}

export async function deleteFlashcard({ userId, flashcardId }) {
  await getOwnedFlashcard(userId, flashcardId);
  await deleteFlashcardDb(flashcardId);
}