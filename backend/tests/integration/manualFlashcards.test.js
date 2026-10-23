import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mockamos o flashcardService para isolar a rota e o controller
jest.unstable_mockModule('../../src/services/flashcardService.js', () => ({
  createManualFlashcard: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const flashcardService = await import('../../src/services/flashcardService.js');

describe('Integração - Flashcards Manuais (/notes/:noteId/flashcards)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve criar um flashcard manual com sucesso e retornar status 201', async () => {
    const mockCreatedCard = {
      flashcardId: 'card_123',
      noteId: 'note_456',
      front: 'O que é o Stack na memória?',
      back: 'Área de memória LIFO usada para variáveis locais.',
      createdAt: new Date().toISOString()
    };

    flashcardService.createManualFlashcard.mockResolvedValue(mockCreatedCard);

    const response = await request(app)
      .post('/notes/note_456/flashcards')
      .send({
        front: 'O que é o Stack na memória?',
        back: 'Área de memória LIFO usada para variáveis locais.'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.flashcard).toHaveProperty('flashcardId', 'card_123');
    expect(flashcardService.createManualFlashcard).toHaveBeenCalledWith({
      noteId: 'note_456',
      front: 'O que é o Stack na memória?',
      back: 'Área de memória LIFO usada para variáveis locais.'
    });
  });

  it('Deve retornar erro 400 se front ou back estiverem faltando', async () => {
    flashcardService.createManualFlashcard.mockRejectedValue(
      new Error('Os campos front e back são obrigatórios.')
    );

    const response = await request(app)
      .post('/notes/note_456/flashcards')
      .send({ front: 'Apenas a pergunta?' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('obrigatórios');
  });
});