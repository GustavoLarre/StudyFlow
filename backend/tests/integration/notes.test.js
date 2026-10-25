import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn()
}));

describe('Integração - Rota de Geração de Flashcards', () => {
  let app, createNoteDb, generateFlashcardsFromText;

  beforeAll(async () => {
    app = (await import('../../src/app.js')).default;
    createNoteDb = (await import('../../src/repositories/noteRepository.js')).createNoteDb;
    generateFlashcardsFromText = (await import('../../src/services/aiClient.js')).generateFlashcardsFromText;
  });

  beforeEach(() => {
    generateFlashcardsFromText.mockResolvedValue([
      { front: 'O que são microsserviços?', back: 'Pequenos serviços independentes.' }
    ]);
  });

  it('Deve retornar 201 e os flashcards gerados', async () => {
    const savedNote = await createNoteDb({
      subjectId: '1',
      title: 'Arquitetura de Microsserviços',
      content: 'Microsserviços são pequenos serviços independentes.',
      createdAt: new Date().toISOString()
    });

    const response = await request(app)
      .post(`/notes/${savedNote.noteId}/generate-flashcards`)
      .send();

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('flashcards');
  });
});