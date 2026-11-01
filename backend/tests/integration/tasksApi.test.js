import request from 'supertest';
import app from '../../src/app.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - Módulo de Tarefas (/tasks)', () => {
  let createdTaskId;
  let authHeader;

  beforeAll(async () => {
    await clearAll();
    const { idToken } = await createTestUser();
    authHeader = `Bearer ${idToken}`;
  });

  it('Deve criar uma tarefa com sucesso via POST /tasks', async () => {
    const response = await request(app)
      .post('/tasks')
      .set('Authorization', authHeader)
      .send({
        date: '2026-10-23',
        text: 'Estudar arquitetura microsserviços'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('taskId');
    expect(response.body.text).toBe('Estudar arquitetura microsserviços');

    createdTaskId = response.body.taskId;
  });

  it('Deve listar as tarefas pendentes via GET /tasks', async () => {
    const response = await request(app)
      .get('/tasks')
      .set('Authorization', authHeader);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);

    const found = response.body.find(t => t.taskId === createdTaskId);
    expect(found).toBeDefined();
  });

  it('Deve concluir e remover a tarefa via PATCH /tasks/:taskId/complete', async () => {
    const response = await request(app)
      .patch(`/tasks/${createdTaskId}/complete`)
      .set('Authorization', authHeader);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('Deve responder 401 sem token', async () => {
    const response = await request(app).get('/tasks');

    expect(response.status).toBe(401);
  });
});