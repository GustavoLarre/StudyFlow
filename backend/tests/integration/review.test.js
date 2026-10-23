import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/services/flashcardService.js', () => ({
  reviewFlashcard: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const flashcardService = await import('../../src/services/flashcardService.js');

describe('Integração - Rota de Revisão de Flashcard (/flashcards/:flashcardId/review)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve registrar a revisão, calcular o XP ganho e retornar status 200', async () => {
    const mockReviewResult = {
      flashcard: {
        flashcardId: 'card_123',
        interval: 6,
        repetition: 2,
        easeFactor: 2.5,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      gamification: {
        gainedXp: 10,
        totalXp: 110,
        level: 2,
        leveledUp: true
      }
    };

    flashcardService.reviewFlashcard.mockResolvedValue(mockReviewResult);

    const response = await request(app)
      .post('/flashcards/card_123/review')
      .send({ rating: 'good' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.flashcard).toHaveProperty('interval', 6);
    expect(response.body.gamification).toHaveProperty('gainedXp', 10);
    expect(response.body.gamification).toHaveProperty('level', 2);
    expect(flashcardService.reviewFlashcard).toHaveBeenCalledWith('card_123', 'good');
  });

  it('Deve retornar erro 400 se a avaliação (rating) for inválida', async () => {
    flashcardService.reviewFlashcard.mockRejectedValue(
      new Error('Avaliação inválida: perfect')
    );

    const response = await request(app)
      .post('/flashcards/card_123/review')
      .send({ rating: 'perfect' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('Avaliação inválida');
  });
});