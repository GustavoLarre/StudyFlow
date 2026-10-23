import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/services/flashcardService.js', () => ({
  getDueFlashcards: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const flashcardService = await import('../../src/services/flashcardService.js');

describe('Integração - Flashcards Vencidos para Revisão (/review/due)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve retornar a lista de flashcards devidos com status 200', async () => {
    const mockDueCards = [
      { flashcardId: 'card_1', front: 'O que é Stack?', dueDate: '2026-06-01T00:00:00.000Z' }
    ];

    flashcardService.getDueFlashcards.mockResolvedValue(mockDueCards);

    const response = await request(app).get('/review/due');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.flashcards).toHaveLength(1);
    expect(response.body.flashcards[0]).toHaveProperty('flashcardId', 'card_1');
  });
});