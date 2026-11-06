import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { uid: 'user_teste', plan: 'free', xp: 0, level: 1 };
    next();
  }
}));

jest.unstable_mockModule('../../src/services/taskService.js', () => ({
  createTask: jest.fn(),
  listTasks: jest.fn(),
  updateTask: jest.fn(),
  setTaskCompleted: jest.fn(),
  deleteTask: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const service = await import('../../src/services/taskService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

describe('Integração - Tarefas (rotas)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /tasks cria com o uid e responde 201', async () => {
    service.createTask.mockResolvedValue({ taskId: 't1' });

    const response = await request(app).post('/tasks').send({ date: '2026-10-23', text: 'Estudar' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ success: true, task: { taskId: 't1' } });
    expect(service.createTask).toHaveBeenCalledWith({
      userId: 'user_teste', date: '2026-10-23', text: 'Estudar'
    });
  });

  it('POST /tasks responde 400 para validação', async () => {
    service.createTask.mockRejectedValue(new ValidationError('O texto da tarefa é obrigatório.'));

    const response = await request(app).post('/tasks').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false });
  });

  it('GET /tasks lista as tarefas do usuário', async () => {
    service.listTasks.mockResolvedValue([{ taskId: 't1' }, { taskId: 't2' }]);

    const response = await request(app).get('/tasks');

    expect(response.status).toBe(200);
    expect(response.body.tasks).toHaveLength(2);
    expect(service.listTasks).toHaveBeenCalledWith('user_teste');
  });

  it('PUT /tasks/:id atualiza e responde 404 para tarefa alheia', async () => {
    service.updateTask.mockResolvedValueOnce({ taskId: 't1', text: 'Novo' });
    const ok = await request(app).put('/tasks/t1').send({ text: 'Novo' });
    expect(ok.status).toBe(200);
    expect(service.updateTask).toHaveBeenCalledWith({
      userId: 'user_teste', taskId: 't1', date: undefined, text: 'Novo'
    });

    service.updateTask.mockRejectedValueOnce(new NotFoundError('Tarefa não encontrada.'));
    const missing = await request(app).put('/tasks/x').send({ text: 'Novo' });
    expect(missing.status).toBe(404);
  });

  it('PATCH /tasks/:id/complete conclui (padrão) e aceita completed false', async () => {
    service.setTaskCompleted.mockResolvedValue({ taskId: 't1', completed: true });

    const done = await request(app).patch('/tasks/t1/complete').send();
    expect(done.status).toBe(200);
    expect(service.setTaskCompleted).toHaveBeenCalledWith({
      userId: 'user_teste', taskId: 't1', completed: undefined
    });

    await request(app).patch('/tasks/t1/complete').send({ completed: false });
    expect(service.setTaskCompleted).toHaveBeenLastCalledWith({
      userId: 'user_teste', taskId: 't1', completed: false
    });
  });

  it('DELETE /tasks/:id exclui e responde 200', async () => {
    service.deleteTask.mockResolvedValue();

    const response = await request(app).delete('/tasks/t1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(service.deleteTask).toHaveBeenCalledWith({ userId: 'user_teste', taskId: 't1' });
  });
});