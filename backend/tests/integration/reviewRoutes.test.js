import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { uid: 'user_teste', plan: 'free', xp: 0, level: 1 };
    next();
  }
}));

jest.unstable_mockModule('../../src/services/reviewService.js', () => ({
  reviewFlashcard: jest.fn(),
  getDueFlashcards: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const service = await import('../../src/services/reviewService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

describe('Integração - Revisão (rotas)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /flashcards/:id/review responde 200 com flashcard e gamification', async () => {
    service.reviewFlashcard.mockResolvedValue({
      flashcard: { flashcardId: 'c1', state: 'learning' },
      gamification: { gainedXp: 3, totalXp: 3, level: 1, leveledUp: false }
    });

    const response = await request(app).post('/flashcards/c1/review').send({ action: 'good' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      flashcard: { flashcardId: 'c1' },
      gamification: { gainedXp: 3 }
    });
    expect(service.reviewFlashcard).toHaveBeenCalledWith({
      userId: 'user_teste', flashcardId: 'c1', action: 'good'
    });
  });

  it('POST responde 400 para ação inválida e 404 para card alheio', async () => {
    service.reviewFlashcard.mockRejectedValueOnce(new ValidationError('Avaliação inválida.'));
    const bad = await request(app).post('/flashcards/c1/review').send({ action: 'perfect' });
    expect(bad.status).toBe(400);

    service.reviewFlashcard.mockRejectedValueOnce(new NotFoundError('Flashcard não encontrado.'));
    const missing = await request(app).post('/flashcards/x/review').send({ action: 'good' });
    expect(missing.status).toBe(404);
  });

  it('GET /review/due lista todas as matérias misturadas', async () => {
    service.getDueFlashcards.mockResolvedValue({ flashcards: [{ flashcardId: 'c1' }], total: 1 });

    const response = await request(app).get('/review/due');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, total: 1 });
    expect(service.getDueFlashcards).toHaveBeenCalledWith({ userId: 'user_teste', subjectId: undefined });
  });

  it('GET /review/due?subjectId=s1 filtra por matéria e devolve 404 se alheia', async () => {
    service.getDueFlashcards.mockResolvedValueOnce({ flashcards: [], total: 0 });
    const ok = await request(app).get('/review/due?subjectId=s1');
    expect(ok.status).toBe(200);
    expect(service.getDueFlashcards).toHaveBeenCalledWith({ userId: 'user_teste', subjectId: 's1' });

    service.getDueFlashcards.mockRejectedValueOnce(new NotFoundError('Matéria não encontrada.'));
    const missing = await request(app).get('/review/due?subjectId=x');
    expect(missing.status).toBe(404);
  });
});