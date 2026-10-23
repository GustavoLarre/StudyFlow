import request from 'supertest';
import app from '../../src/app.js';

describe('Integração - Módulo de Tarefas (/tasks)', () => {
  let createdTaskId;

  it('Deve criar uma tarefa com sucesso via POST /tasks', async () => {
    const response = await request(app)
      .post('/tasks')
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
    const response = await request(app).get('/tasks');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    const found = response.body.find(t => t.taskId === createdTaskId);
    expect(found).toBeDefined();
  });

  it('Deve concluir e remover a tarefa via PATCH /tasks/:taskId/complete', async () => {
    const response = await request(app).patch(`/tasks/${createdTaskId}/complete`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});