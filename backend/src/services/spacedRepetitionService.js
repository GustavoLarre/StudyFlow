/**
 * Calcula o próximo estado de revisão de um flashcard com base na resposta do usuário.
 * Respostas suportadas: 'again' (errou/reinicia), 'hard' (difícil), 'good' (bom), 'easy' (fácil).
 */
export function calculateNextReview(cardState, rating) {
  let { interval = 0, repetition = 0, easeFactor = 2.5 } = cardState;
  
  const normalizedRating = rating.toLowerCase();

  if (normalizedRating === 'again') {
    interval = 1;
    repetition = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (normalizedRating === 'hard') {
    interval = Math.max(1, Math.round(interval * 1.2));
    repetition += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (normalizedRating === 'good') {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else if (normalizedRating === 'easy') {
    if (repetition === 0) {
      interval = 4;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    repetition += 1;
    easeFactor += 0.15;
  } else {
    throw new Error(`Avaliação inválida: ${rating}`);
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    interval,
    repetition,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    dueDate: dueDate.toISOString()
  };
}