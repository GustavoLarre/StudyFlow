import { describe, it, expect } from '@jest/globals';
import {
  FLASHCARD_SOURCES,
  CARD_STATES,
  INITIAL_RATING,
  REVIEW_RATINGS,
  INITIAL_EASE_FACTOR,
  buildNewFlashcard
} from '../../src/config/flashcards.js';

describe('Unidade - Defaults de flashcard', () => {
  it('Deve expor as origens manual e ai', () => {
    expect(FLASHCARD_SOURCES).toEqual({ MANUAL: 'manual', AI: 'ai' });
  });

  it('Deve expor os estados do Anki clássico', () => {
    expect(CARD_STATES).toEqual({
      NEW: 'new',
      LEARNING: 'learning',
      REVIEW: 'review',
      RELEARNING: 'relearning'
    });
  });

  it('Deve mapear os botões de revisão para rating 1 a 4', () => {
    expect(REVIEW_RATINGS).toEqual({ again: 1, hard: 2, good: 3, easy: 4 });
  });

  it('Rating inicial deve ser 1 (difícil) e ease inicial 2.5', () => {
    expect(INITIAL_RATING).toBe(1);
    expect(INITIAL_EASE_FACTOR).toBe(2.5);
  });

  describe('buildNewFlashcard', () => {
    const base = { userId: 'u1', subjectId: 's1', front: 'P?', back: 'R.' };

    it('Deve montar um card novo com os defaults de repetição espaçada', () => {
      const card = buildNewFlashcard({ ...base, source: FLASHCARD_SOURCES.MANUAL });

      expect(card).toMatchObject({
        userId: 'u1',
        subjectId: 's1',
        noteId: null,
        source: 'manual',
        front: 'P?',
        back: 'R.',
        rating: INITIAL_RATING,
        state: CARD_STATES.NEW,
        step: 0,
        lapses: 0,
        interval: 0,
        repetition: 0,
        easeFactor: INITIAL_EASE_FACTOR
      });
    });

    it('Deve vencer imediatamente e registrar createdAt e updatedAt', () => {
      const before = Date.now();
      const card = buildNewFlashcard({ ...base, source: FLASHCARD_SOURCES.MANUAL });

      expect(new Date(card.dueDate).getTime()).toBeGreaterThanOrEqual(before);
      expect(new Date(card.dueDate).getTime()).toBeLessThanOrEqual(Date.now());
      expect(typeof card.createdAt).toBe('string');
      expect(card.updatedAt).toBe(card.createdAt);
    });

    it('Deve guardar o noteId quando informado (card gerado de uma nota)', () => {
      const card = buildNewFlashcard({ ...base, noteId: 'n1', source: FLASHCARD_SOURCES.AI });

      expect(card.noteId).toBe('n1');
      expect(card.source).toBe('ai');
    });

    it('Deve rejeitar origem desconhecida', () => {
      expect(() => buildNewFlashcard({ ...base, source: 'outra' })).toThrow('source');
    });
  });
});