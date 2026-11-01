import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { uid: 'user_teste', plan: 'free', xp: 0, level: 1 };
    next();
  }
}));

jest.unstable_mockModule('../../src/services/notesService.js', () => ({
  createNote: jest.fn(),
  listNotes: jest.fn(),
  getNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  generateFlashcardsForNote: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const notesService = await import('../../src/services/notesService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

describe('Integração - Notas (/subjects/:subjectId/notes e /notes/:id)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /subjects/:subjectId/notes cria com o uid e responde 201', async () => {
    notesService.createNote.mockResolvedValue({ noteId: 'n1', title: 'T' });

    const response = await request(app)
      .post('/subjects/s1/notes')
      .send({ title: 'T', content: 'c' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ success: true, note: { noteId: 'n1' } });
    expect(notesService.createNote).toHaveBeenCalledWith({
      userId: 'user_teste', subjectId: 's1', title: 'T', content: 'c'
    });
  });

  it('POST responde 400 para conteúdo inválido', async () => {
    notesService.createNote.mockRejectedValue(new ValidationError('Conteúdo da nota é obrigatório.'));

    const response = await request(app).post('/subjects/s1/notes').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, error: 'Conteúdo da nota é obrigatório.' });
  });

  it('POST responde 404 para matéria que não é do usuário', async () => {
    notesService.createNote.mockRejectedValue(new NotFoundError('Matéria não encontrada.'));

    const response = await request(app).post('/subjects/s9/notes').send({ content: 'c' });

    expect(response.status).toBe(404);
  });

  it('GET /subjects/:subjectId/notes lista as notas', async () => {
    notesService.listNotes.mockResolvedValue([{ noteId: 'n1' }, { noteId: 'n2' }]);

    const response = await request(app).get('/subjects/s1/notes');

    expect(response.status).toBe(200);
    expect(response.body.notes).toHaveLength(2);
    expect(notesService.listNotes).toHaveBeenCalledWith({ userId: 'user_teste', subjectId: 's1' });
  });

  it('GET /notes/:id retorna a nota e 404 quando não encontrada', async () => {
    notesService.getNote.mockResolvedValueOnce({ noteId: 'n1' });
    const ok = await request(app).get('/notes/n1');
    expect(ok.status).toBe(200);
    expect(ok.body.note).toHaveProperty('noteId', 'n1');
    expect(notesService.getNote).toHaveBeenCalledWith({ userId: 'user_teste', noteId: 'n1' });

    notesService.getNote.mockRejectedValueOnce(new NotFoundError('Nota não encontrada.'));
    const missing = await request(app).get('/notes/x');
    expect(missing.status).toBe(404);
  });

  it('PUT /notes/:id atualiza título e conteúdo', async () => {
    notesService.updateNote.mockResolvedValue({ noteId: 'n1', title: 'Novo' });

    const response = await request(app).put('/notes/n1').send({ title: 'Novo', content: 'c2' });

    expect(response.status).toBe(200);
    expect(notesService.updateNote).toHaveBeenCalledWith({
      userId: 'user_teste', noteId: 'n1', title: 'Novo', content: 'c2'
    });
  });

  it('DELETE /notes/:id exclui e responde 200', async () => {
    notesService.deleteNote.mockResolvedValue();

    const response = await request(app).delete('/notes/n1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(notesService.deleteNote).toHaveBeenCalledWith({ userId: 'user_teste', noteId: 'n1' });
  });
});