import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { uid: 'user_teste', plan: 'free', xp: 0, level: 1 };
    next();
  }
}));

jest.unstable_mockModule('../../src/services/flashcardService.js', () => ({
  createFlashcard: jest.fn(),
  listFlashcards: jest.fn(),
  getFlashcard: jest.fn(),
  updateFlashcard: jest.fn(),
  deleteFlashcard: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const service = await import('../../src/services/flashcardService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

describe('Integração - Flashcards (rotas)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /subjects/:subjectId/flashcards cria e responde 201 com gamification', async () => {
    service.createFlashcard.mockResolvedValue({
      flashcard: { flashcardId: 'c1' },
      gamification: { gainedXp: 1, totalXp: 1, level: 1 }
    });

    const response = await request(app)
      .post('/subjects/s1/flashcards')
      .send({ front: 'P?', back: 'R.', noteId: 'n1' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      flashcard: { flashcardId: 'c1' },
      gamification: { gainedXp: 1 }
    });
    expect(service.createFlashcard).toHaveBeenCalledWith({
      userId: 'user_teste', subjectId: 's1', noteId: 'n1', front: 'P?', back: 'R.'
    });
  });

  it('POST responde 400 para validação e 404 para matéria alheia', async () => {
    service.createFlashcard.mockRejectedValueOnce(new ValidationError('O campo front é obrigatório.'));
    const bad = await request(app).post('/subjects/s1/flashcards').send({ back: 'R' });
    expect(bad.status).toBe(400);
    expect(bad.body).toMatchObject({ success: false, error: 'O campo front é obrigatório.' });

    service.createFlashcard.mockRejectedValueOnce(new NotFoundError('Matéria não encontrada.'));
    const missing = await request(app).post('/subjects/x/flashcards').send({ front: 'P', back: 'R' });
    expect(missing.status).toBe(404);
  });

  it('GET /subjects/:subjectId/flashcards lista os cards', async () => {
    service.listFlashcards.mockResolvedValue([{ flashcardId: 'c1' }, { flashcardId: 'c2' }]);

    const response = await request(app).get('/subjects/s1/flashcards');

    expect(response.status).toBe(200);
    expect(response.body.flashcards).toHaveLength(2);
    expect(service.listFlashcards).toHaveBeenCalledWith({ userId: 'user_teste', subjectId: 's1' });
  });

  it('GET /flashcards/:id retorna o card e 404 quando não encontrado', async () => {
    service.getFlashcard.mockResolvedValueOnce({ flashcardId: 'c1' });
    const ok = await request(app).get('/flashcards/c1');
    expect(ok.status).toBe(200);
    expect(service.getFlashcard).toHaveBeenCalledWith({ userId: 'user_teste', flashcardId: 'c1' });

    service.getFlashcard.mockRejectedValueOnce(new NotFoundError('Flashcard não encontrado.'));
    const missing = await request(app).get('/flashcards/x');
    expect(missing.status).toBe(404);
  });

  it('PUT /flashcards/:id atualiza front e back', async () => {
    service.updateFlashcard.mockResolvedValue({ flashcardId: 'c1', front: 'Novo' });

    const response = await request(app).put('/flashcards/c1').send({ front: 'Novo', back: 'B' });

    expect(response.status).toBe(200);
    expect(service.updateFlashcard).toHaveBeenCalledWith({
      userId: 'user_teste', flashcardId: 'c1', front: 'Novo', back: 'B'
    });
  });

  it('DELETE /flashcards/:id exclui e responde 200', async () => {
    service.deleteFlashcard.mockResolvedValue();

    const response = await request(app).delete('/flashcards/c1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(service.deleteFlashcard).toHaveBeenCalledWith({ userId: 'user_teste', flashcardId: 'c1' });
  });
});