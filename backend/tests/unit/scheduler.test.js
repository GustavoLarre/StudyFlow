import { describe, it, expect } from '@jest/globals';
import { calculateNextReview } from '../../src/services/scheduler.js';

const NOW = new Date('2026-01-01T12:00:00.000Z');
const minutes = (n) => new Date(NOW.getTime() + n * 60000).toISOString();
const days = (n) => new Date(NOW.getTime() + n * 86400000).toISOString();

const newCard = () => ({ state: 'new', step: 0, interval: 0, easeFactor: 2.5, lapses: 0 });
const learningCard = (step) => ({ ...newCard(), state: 'learning', step });

describe('Unidade - scheduler: new e learning', () => {
  describe('card novo', () => {
    it('again: vai para learning no passo 0 e vence em 1 min', () => {
      expect(calculateNextReview(newCard(), 'again', NOW)).toMatchObject({
        state: 'learning', step: 0, interval: 0, easeFactor: 2.5, dueDate: minutes(1)
      });
    });

    it('hard: mantém o passo 0 e vence em 1 min', () => {
      expect(calculateNextReview(newCard(), 'hard', NOW)).toMatchObject({
        state: 'learning', step: 0, dueDate: minutes(1)
      });
    });

    it('good: avança para o passo 1 e vence em 10 min', () => {
      expect(calculateNextReview(newCard(), 'good', NOW)).toMatchObject({
        state: 'learning', step: 1, interval: 0, dueDate: minutes(10)
      });
    });

    it('easy: gradua com 4 dias e ease +0.15', () => {
      expect(calculateNextReview(newCard(), 'easy', NOW)).toMatchObject({
        state: 'review', step: 0, interval: 4, easeFactor: 2.65, dueDate: days(4)
      });
    });
  });

  describe('card em learning', () => {
    it('again no passo 1 volta ao passo 0', () => {
      expect(calculateNextReview(learningCard(1), 'again', NOW)).toMatchObject({
        state: 'learning', step: 0, dueDate: minutes(1)
      });
    });

    it('hard no passo 1 mantém o passo e vence em 10 min', () => {
      expect(calculateNextReview(learningCard(1), 'hard', NOW)).toMatchObject({
        state: 'learning', step: 1, dueDate: minutes(10)
      });
    });

    it('good no último passo gradua com 1 dia e mantém o ease', () => {
      expect(calculateNextReview(learningCard(1), 'good', NOW)).toMatchObject({
        state: 'review', step: 0, interval: 1, easeFactor: 2.5, dueDate: days(1)
      });
    });

    it('easy gradua com 4 dias e ease +0.15', () => {
      expect(calculateNextReview(learningCard(1), 'easy', NOW)).toMatchObject({
        state: 'review', interval: 4, easeFactor: 2.65, dueDate: days(4)
      });
    });
  });

  describe('contrato', () => {
    it('Não altera o card recebido', () => {
      const card = newCard();
      calculateNextReview(card, 'good', NOW);
      expect(card).toEqual(newCard());
    });

    it('Mantém os lapsos', () => {
      const card = { ...learningCard(0), lapses: 2 };
      expect(calculateNextReview(card, 'good', NOW).lapses).toBe(2);
    });

    it('Rejeita ação inválida', () => {
      expect(() => calculateNextReview(newCard(), 'perfect', NOW)).toThrow('Avaliação inválida');
    });
  });
});

const reviewCard = (overrides = {}) => ({
  state: 'review', step: 0, interval: 10, easeFactor: 2.5, lapses: 0, ...overrides
});

describe('Unidade - scheduler: review', () => {
  it('again: lapso, ease -0.20, vai para relearning e vence em 10 min, preservando o intervalo', () => {
    expect(calculateNextReview(reviewCard(), 'again', NOW)).toMatchObject({
      state: 'relearning', step: 0, interval: 10, easeFactor: 2.3, lapses: 1, dueDate: minutes(10)
    });
  });

  it('hard: intervalo x1.2 e ease -0.15', () => {
    expect(calculateNextReview(reviewCard(), 'hard', NOW)).toMatchObject({
      state: 'review', interval: 12, easeFactor: 2.35, dueDate: days(12)
    });
  });

  it('good: intervalo x ease, ease inalterado', () => {
    expect(calculateNextReview(reviewCard(), 'good', NOW)).toMatchObject({
      state: 'review', interval: 25, easeFactor: 2.5, dueDate: days(25)
    });
  });

  it('easy: intervalo x ease x 1.3 e ease +0.15', () => {
    expect(calculateNextReview(reviewCard(), 'easy', NOW)).toMatchObject({
      state: 'review', interval: 33, easeFactor: 2.65, dueDate: days(33)
    });
  });

  it('Sempre avança ao menos 1 dia, mesmo com intervalo pequeno', () => {
    const card = reviewCard({ interval: 1, easeFactor: 1.3 });

    expect(calculateNextReview(card, 'hard', NOW).interval).toBe(2);
  });

  it('Mantém hard <= good <= easy estritamente crescente', () => {
    const card = reviewCard({ interval: 1, easeFactor: 1.3 });
    const hard = calculateNextReview(card, 'hard', NOW).interval;
    const good = calculateNextReview(card, 'good', NOW).interval;
    const easy = calculateNextReview(card, 'easy', NOW).interval;

    expect(good).toBeGreaterThan(hard);
    expect(easy).toBeGreaterThan(good);
  });

  it('O ease nunca fica abaixo de 1.3', () => {
    const card = reviewCard({ easeFactor: 1.3 });

    expect(calculateNextReview(card, 'again', NOW).easeFactor).toBe(1.3);
    expect(calculateNextReview(card, 'hard', NOW).easeFactor).toBe(1.3);
  });

  it('Acumula lapsos', () => {
    expect(calculateNextReview(reviewCard({ lapses: 3 }), 'again', NOW).lapses).toBe(4);
  });
});

const relearningCard = (overrides = {}) => ({
  state: 'relearning', step: 0, interval: 10, easeFactor: 2.3, lapses: 1, ...overrides
});

describe('Unidade - scheduler: relearning', () => {
  it('again: continua em relearning no passo 0 e vence em 10 min, sem mexer em ease e lapsos', () => {
    expect(calculateNextReview(relearningCard(), 'again', NOW)).toMatchObject({
      state: 'relearning', step: 0, interval: 10, easeFactor: 2.3, lapses: 1, dueDate: minutes(10)
    });
  });

  it('hard: repete o passo e vence em 10 min', () => {
    expect(calculateNextReview(relearningCard(), 'hard', NOW)).toMatchObject({
      state: 'relearning', step: 0, dueDate: minutes(10)
    });
  });

  it('good: gradua para review com o intervalo anterior e ease inalterado', () => {
    expect(calculateNextReview(relearningCard(), 'good', NOW)).toMatchObject({
      state: 'review', step: 0, interval: 10, easeFactor: 2.3, lapses: 1, dueDate: days(10)
    });
  });

  it('easy: gradua com intervalo anterior + 1 dia e ease +0.15', () => {
    expect(calculateNextReview(relearningCard(), 'easy', NOW)).toMatchObject({
      state: 'review', interval: 11, easeFactor: 2.45, dueDate: days(11)
    });
  });

  it('Garante intervalo mínimo de 1 dia ao graduar (good) e 2 dias (easy)', () => {
    const card = relearningCard({ interval: 0 });

    expect(calculateNextReview(card, 'good', NOW).interval).toBe(1);
    expect(calculateNextReview(card, 'easy', NOW).interval).toBe(2);
  });

  it('Ciclo completo: review -> again -> relearning -> good volta a review com 1 lapso', () => {
    const afterLapse = calculateNextReview(reviewCard(), 'again', NOW);
    const graduated = calculateNextReview(afterLapse, 'good', NOW);

    expect(afterLapse.state).toBe('relearning');
    expect(graduated).toMatchObject({ state: 'review', interval: 10, lapses: 1 });
  });

  it('Estado desconhecido continua lançando erro', () => {
    expect(() => calculateNextReview({ ...newCard(), state: 'xyz' }, 'good', NOW))
      .toThrow('Estado não suportado');
  });
});