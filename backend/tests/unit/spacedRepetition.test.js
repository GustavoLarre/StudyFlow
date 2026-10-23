import { describe, it, expect } from '@jest/globals';
import { calculateNextReview } from '../../src/services/spacedRepetitionService.js';

describe('Unidade - Algoritmo de Repetição Espaçada', () => {
  it('Deve resetar o intervalo e repetições se o usuário errar (Again / 1)', () => {
    const cardState = {
      interval: 10,
      repetition: 4,
      easeFactor: 2.5
    };

    const result = calculateNextReview(cardState, 'again');

    expect(result.interval).toBe(1);
    expect(result.repetition).toBe(0);
    expect(result.dueDate).toBeDefined();
  });

  it('Deve incrementar o intervalo adequadamente se o usuário acertar (Easy / 4)', () => {
    const cardState = {
      interval: 1,
      repetition: 1,
      easeFactor: 2.5
    };

    const result = calculateNextReview(cardState, 'easy');

    expect(result.interval).toBeGreaterThan(1);
    expect(result.repetition).toBe(2);
    expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
  });
});