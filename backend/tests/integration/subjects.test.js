import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { uid: 'user_teste', plan: 'free', xp: 0, level: 1 };
    next();
  }
}));

jest.unstable_mockModule('../../src/services/subjectService.js', () => ({
  createSubject: jest.fn(),
  getAllSubjects: jest.fn(),
  getSubject: jest.fn(),
  updateSubject: jest.fn(),
  deleteSubject: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const subjectService = await import('../../src/services/subjectService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

describe('Integração - Módulo de Matérias (/subjects)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /subjects cria com o uid do usuário e responde 201', async () => {
    subjectService.createSubject.mockResolvedValue({ subjectId: 's1', title: 'Grafos' });

    const response = await request(app).post('/subjects').send({ title: 'Grafos' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ success: true, subject: { title: 'Grafos' } });
    expect(subjectService.createSubject).toHaveBeenCalledWith({ userId: 'user_teste', title: 'Grafos' });
  });

  it('POST /subjects responde 400 para título inválido', async () => {
    subjectService.createSubject.mockRejectedValue(new ValidationError('O título da matéria é obrigatório.'));

    const response = await request(app).post('/subjects').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, error: 'O título da matéria é obrigatório.' });
  });

  it('GET /subjects lista as matérias do usuário', async () => {
    subjectService.getAllSubjects.mockResolvedValue([{ subjectId: 's1' }, { subjectId: 's2' }]);

    const response = await request(app).get('/subjects');

    expect(response.status).toBe(200);
    expect(response.body.subjects).toHaveLength(2);
    expect(subjectService.getAllSubjects).toHaveBeenCalledWith('user_teste');
  });

  it('GET /subjects/:id retorna a matéria', async () => {
    subjectService.getSubject.mockResolvedValue({ subjectId: 's1', title: 'Grafos' });

    const response = await request(app).get('/subjects/s1');

    expect(response.status).toBe(200);
    expect(response.body.subject).toHaveProperty('subjectId', 's1');
    expect(subjectService.getSubject).toHaveBeenCalledWith({ userId: 'user_teste', subjectId: 's1' });
  });

  it('GET /subjects/:id responde 404 quando não encontrada', async () => {
    subjectService.getSubject.mockRejectedValue(new NotFoundError('Matéria não encontrada.'));

    const response = await request(app).get('/subjects/x');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, error: 'Matéria não encontrada.' });
  });

  it('PUT /subjects/:id atualiza o título', async () => {
    subjectService.updateSubject.mockResolvedValue({ subjectId: 's1', title: 'Novo' });

    const response = await request(app).put('/subjects/s1').send({ title: 'Novo' });

    expect(response.status).toBe(200);
    expect(response.body.subject.title).toBe('Novo');
    expect(subjectService.updateSubject).toHaveBeenCalledWith({
      userId: 'user_teste', subjectId: 's1', title: 'Novo'
    });
  });

  it('DELETE /subjects/:id exclui e informa o que foi removido', async () => {
    subjectService.deleteSubject.mockResolvedValue({ notes: 2, flashcards: 5 });

    const response = await request(app).delete('/subjects/s1');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, deleted: { notes: 2, flashcards: 5 } });
    expect(subjectService.deleteSubject).toHaveBeenCalledWith({ userId: 'user_teste', subjectId: 's1' });
  });

  it('Erro inesperado responde 500 sem vazar detalhes', async () => {
    subjectService.getAllSubjects.mockRejectedValue(new Error('segredo interno do Firestore'));

    const response = await request(app).get('/subjects');

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain('segredo');
  });
});