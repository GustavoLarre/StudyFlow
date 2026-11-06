import request from 'supertest';
import app from '../../src/app.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - Tarefas ponta a ponta', () => {
  let alice, bob;

  beforeEach(async () => {
    await clearAll();
    alice = `Bearer ${(await createTestUser({ email: 'alice@teste.com' })).idToken}`;
    bob = `Bearer ${(await createTestUser({ email: 'bob@teste.com' })).idToken}`;
  });

  const create = (auth, text = 'Estudar grafos') =>
    request(app).post('/tasks').set('Authorization', auth).send({ date: '2026-10-23', text });

  it('CRUD completo: concluir NÃO apaga, e o usuário exclui depois', async () => {
    const created = await create(alice);
    expect(created.status).toBe(201);
    const id = created.body.task.taskId;

    const done = await request(app).patch(`/tasks/${id}/complete`).set('Authorization', alice).send();
    expect(done.body.task).toMatchObject({ completed: true });
    expect(done.body.task.completedAt).toEqual(expect.any(String));

    const list = await request(app).get('/tasks').set('Authorization', alice);
    expect(list.body.tasks).toHaveLength(1);
    expect(list.body.tasks[0].completed).toBe(true);

    const reopened = await request(app).patch(`/tasks/${id}/complete`).set('Authorization', alice).send({ completed: false });
    expect(reopened.body.task).toMatchObject({ completed: false, completedAt: null });

    const edited = await request(app).put(`/tasks/${id}`).set('Authorization', alice).send({ text: 'Novo texto' });
    expect(edited.body.task.text).toBe('Novo texto');

    expect((await request(app).delete(`/tasks/${id}`).set('Authorization', alice)).status).toBe(200);
    expect((await db.collection('tasks').doc(id).get()).exists).toBe(false);
  });

  it('Cada usuário vê só as próprias tarefas', async () => {
    await create(alice, 'da Alice');
    await create(bob, 'do Bob');

    const list = await request(app).get('/tasks').set('Authorization', alice);

    expect(list.body.tasks.map((t) => t.text)).toEqual(['da Alice']);
  });

  it('Bob não edita, conclui nem exclui tarefa da Alice (404)', async () => {
    const id = (await create(alice)).body.task.taskId;

    expect((await request(app).put(`/tasks/${id}`).set('Authorization', bob).send({ text: 'x' })).status).toBe(404);
    expect((await request(app).patch(`/tasks/${id}/complete`).set('Authorization', bob).send()).status).toBe(404);
    expect((await request(app).delete(`/tasks/${id}`).set('Authorization', bob)).status).toBe(404);
  });

  it('Valida entrada: data inválida e texto vazio respondem 400', async () => {
    const badDate = await request(app).post('/tasks').set('Authorization', alice).send({ date: '2026-02-30', text: 'a' });
    const noText = await request(app).post('/tasks').set('Authorization', alice).send({ date: '2026-10-23', text: ' ' });

    expect(badDate.status).toBe(400);
    expect(noText.status).toBe(400);
  });
});