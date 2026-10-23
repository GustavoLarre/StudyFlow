import { calculateNextReview } from './spacedRepetitionService.js';
import { addXp } from './gamificationService.js';

// Banco em memória simulado para flashcards e usuário
const flashcardsDb = [];
let mockUserSession = { xp: 100, level: 1 }; // Usuário simulado para teste/sessão

export async function createManualFlashcard({ noteId, front, back }) {
  if (!noteId) {
    throw new Error('O ID da nota é obrigatório.');
  }

  if (!front || front.trim() === '' || !back || back.trim() === '') {
    throw new Error('Os campos front e back são obrigatórios.');
  }

  const newFlashcard = {
    flashcardId: `card_${Date.now()}`,
    noteId,
    front: front.trim(),
    back: back.trim(),
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  flashcardsDb.push(newFlashcard);
  return newFlashcard;
}

export async function getFlashcardsByNote(noteId) {
  if (!noteId) {
    throw new Error('O ID da nota é obrigatório.');
  }

  return flashcardsDb.filter(card => card.noteId === noteId);
}

export async function getDueFlashcards() {
  const now = new Date();
  return flashcardsDb.filter(card => new Date(card.dueDate) <= now);
}

/**
 * Realiza a revisão de um flashcard, aplica repetição espaçada e pontua XP.
 */
export async function reviewFlashcard(flashcardId, rating) {
  const normalizedRating = rating.toLowerCase();

  // Tabela de XP por rating
  const xpTable = {
    again: 2,
    hard: 5,
    good: 10,
    easy: 15
  };

  if (!xpTable[normalizedRating]) {
    throw new Error(`Avaliação inválida: ${rating}`);
  }

  const gainedXp = xpTable[normalizedRating];

  let flashcard = flashcardsDb.find(card => card.flashcardId === flashcardId);

  const currentState = flashcard ? {
    interval: flashcard.interval,
    repetition: flashcard.repetition,
    easeFactor: flashcard.easeFactor
  } : { interval: 1, repetition: 1, easeFactor: 2.5 };

  const updatedState = calculateNextReview(currentState, normalizedRating);

  if (flashcard) {
    flashcard.interval = updatedState.interval;
    flashcard.repetition = updatedState.repetition;
    flashcard.easeFactor = updatedState.easeFactor;
    flashcard.dueDate = updatedState.dueDate;
  }

  const targetCard = flashcard || {
    flashcardId,
    ...updatedState
  };

  // Atualiza o XP e o nível do usuário
  const previousLevel = mockUserSession.level;
  const updatedUser = addXp(mockUserSession, gainedXp);
  mockUserSession = updatedUser; // Salva o novo estado na sessão simulada

  const leveledUp = updatedUser.level > previousLevel;

  return {
    flashcard: targetCard,
    gamification: {
      gainedXp,
      totalXp: updatedUser.xp,
      level: updatedUser.level,
      leveledUp
    }
  };
}