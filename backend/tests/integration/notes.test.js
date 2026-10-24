import { jest } from '@jest/globals';

// 1. Mock estrito do aiClient antes de qualquer importação da aplicação
jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn().mockResolvedValue([
    { front: 'O que são microsserviços?', back: 'Pequenos serviços independentes.' }
  ])
}));

import request from 'supertest';

describe('Integração - Rota de Geração de Flashcards (/notes/:noteId/generate-flashcards)', () => {
  let app;
  let createNoteDb;

  beforeAll(async () => {
    // 2. Importações dinâmicas garantem que o mock do aiClient seja injetado corretamente no app
    const appModule = await import('../../src/app.js');
    app = appModule.default;

    const repoModule = await import('../../src/repositories/noteRepository.js');
    createNoteDb = repoModule.createNoteDb;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve retornar 201 e os flashcards gerados quando a nota for processada com sucesso', async () => {
    const savedNote = await createNoteDb({
      subjectId: '1',
      title: 'Arquitetura de Microsserviços',
      content: 'Microsserviços são pequenos serviços independentes.',
      createdAt: new Date().toISOString()
    });

    const noteId = savedNote.noteId || savedNote.id;

    const response = await request(app)
      .post(`/notes/${noteId}/generate-flashcards`)
      .send();

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('flashcards');
  });
});