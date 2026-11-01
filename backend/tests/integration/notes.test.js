import { jest } from '@jest/globals';
import request from 'supertest';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn()
}));

describe('Integração - Rota de Geração de Flashcards', () => {
  let app, db, createNoteDb, generateFlashcardsFromText;
  let authHeader;

  beforeAll(async () => {
    await clearAll();
    const { idToken } = await createTestUser();
    authHeader = `Bearer ${idToken}`;

    app = (await import('../../src/app.js')).default;
    db = (await import('../../src/config/firebase.js')).db;
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
      .set('Authorization', authHeader)
      .send();

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('flashcards');
  });

  it('Deve responder 401 sem token', async () => {
    const response = await request(app).post('/notes/qualquer/generate-flashcards').send();

    expect(response.status).toBe(401);
  });

  it('Deve ter apenas os dados criados neste arquivo de teste', async () => {
    const notes = await db.collection('notes').get();
    const flashcards = await db.collection('flashcards').get();

    expect(notes.size).toBe(1);
    expect(flashcards.size).toBe(1);
  });
});