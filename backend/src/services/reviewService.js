import { getFlashcardByIdDb, updateFlashcardDb, getDueFlashcardsDb } from '../repositories/flashcardRepository.js';
import { getUserByUidDb, updateUserDb } from '../repositories/userRepository.js';
import { getSubjectByIdDb } from '../repositories/subjectRepository.js';
import { calculateNextReview } from './scheduler.js';
import { addXp } from './gamificationService.js';
import { REVIEW_RATINGS, REVIEW_XP } from '../config/flashcards.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';

export const REVIEW_BATCH_LIMIT = 100;

async function grantReviewXp(userId, amount) {
  try {
    const user = await getUserByUidDb(userId);
    const updated = addXp(user, amount);
    await updateUserDb(userId, { xp: updated.xp, level: updated.level });
    return {
      gainedXp: amount,
      totalXp: updated.xp,
      level: updated.level,
      leveledUp: updated.level > user.level
    };
  } catch (error) {
    console.error('Falha ao gravar XP:', error.message);
    return null;
  }
}

async function noXp(userId) {
  const user = await getUserByUidDb(userId);
  return { gainedXp: 0, totalXp: user.xp, level: user.level, leveledUp: false };
}

export async function reviewFlashcard({ userId, flashcardId, action, now = new Date() }) {
  if (typeof action !== 'string' || !Object.hasOwn(REVIEW_RATINGS, action)) {
    throw new ValidationError('Avaliação inválida. Use again, hard, good ou easy.');
  }

  const card = await getFlashcardByIdDb(flashcardId);
  if (!card || card.userId !== userId) {
    throw new NotFoundError('Flashcard não encontrado.');
  }

  // Anti-farm: avaliado antes de atualizar o vencimento
  const wasDue = new Date(card.dueDate) <= now;

  const next = calculateNextReview(card, action, now);

  const flashcard = await updateFlashcardDb(flashcardId, {
    ...next,
    rating: REVIEW_RATINGS[action],
    updatedAt: now.toISOString()
  });

  const gamification = wasDue
    ? await grantReviewXp(userId, REVIEW_XP[action])
    : await noXp(userId);

  return { flashcard, gamification };
}

export async function getDueFlashcards({ userId, subjectId, now = new Date() }) {
  const filter = {};

  if (subjectId) {
    const subject = await getSubjectByIdDb(subjectId);
    if (!subject || subject.userId !== userId) {
      throw new NotFoundError('Matéria não encontrada.');
    }
    filter.subjectId = subjectId;
  }

  const due = await getDueFlashcardsDb(userId, now.toISOString(), filter);

  const flashcards = due
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, REVIEW_BATCH_LIMIT);

  return { flashcards, total: flashcards.length };
}