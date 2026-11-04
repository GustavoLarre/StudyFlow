export const FLASHCARD_SOURCES = Object.freeze({
  MANUAL: 'manual',
  AI: 'ai'
});

export const CARD_STATES = Object.freeze({
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  RELEARNING: 'relearning'
});

// again=1 (difícil), hard=2 (médio), good=3 (fácil), easy=4 (muito fácil)
export const REVIEW_RATINGS = Object.freeze({
  again: 1,
  hard: 2,
  good: 3,
  easy: 4
});

export const INITIAL_RATING = 1;
export const INITIAL_EASE_FACTOR = 2.5;

export function buildNewFlashcard({ userId, subjectId, noteId = null, source, front, back }) {
  if (!Object.values(FLASHCARD_SOURCES).includes(source)) {
    throw new Error(`source inválido: ${source}`);
  }

  const now = new Date().toISOString();

  return {
    userId,
    subjectId,
    noteId,
    source,
    front,
    back,
    rating: INITIAL_RATING,
    state: CARD_STATES.NEW,
    step: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    dueDate: now,
    createdAt: now,
    updatedAt: now
  };
}