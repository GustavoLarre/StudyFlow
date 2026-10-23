import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// 1. Definimos o mock instável para ESM antes de importar o app
jest.unstable_mockModule('../../src/services/notesService.js', () => ({
  generateFlashcardsForNote: jest.fn()
}));

// 2. Importamos dinamicamente as dependências após o mock
const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const notesService = await import('../../src/services/notesService.js');

describe('Integração - Rota de Geração de Flashcards (/notes/:noteId/generate-flashcards)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve retornar 201 e os flashcards gerados quando a nota for processada com sucesso', async () => {
    const mockNoteId = 'note_123';
    
    // Agora o mock funciona perfeitamente com o método do Jest
    notesService.generateFlashcardsForNote.mockResolvedValue([
      {
        noteId: mockNoteId,
        front: 'O que é TDD?',
        back: 'Test-Driven Development',
        createdAt: new Date().toISOString()
      }
    ]);

    const response = await request(app)
      .post(`/notes/${mockNoteId}/generate-flashcards`)
      .send();

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(Array.isArray(response.body.flashcards)).toBe(true);
    expect(response.body.flashcards.length).toBeGreaterThan(0);
    expect(response.body.flashcards[0]).toHaveProperty('noteId', mockNoteId);
  });
});