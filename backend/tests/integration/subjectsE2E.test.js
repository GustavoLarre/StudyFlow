import request from 'supertest';
import app from '../../src/app.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - Matérias ponta a ponta (isolamento por usuário)', () => {
  let alice, bob;

  beforeAll(async () => {
    await clearAll();
    alice = `Bearer ${(await createTestUser({ email: 'alice@teste.com' })).idToken}`;
    bob = `Bearer ${(await createTestUser({ email: 'bob@teste.com' })).idToken}`;
  });

  it('Cada usuário vê só as próprias matérias', async () => {
    await request(app).post('/subjects').set('Authorization', alice).send({ title: 'Da Alice' });
    await request(app).post('/subjects').set('Authorization', bob).send({ title: 'Do Bob' });

    const response = await request(app).get('/subjects').set('Authorization', alice);

    expect(response.body.subjects).toHaveLength(1);
    expect(response.body.subjects[0].title).toBe('Da Alice');
  });

  it('Bob não consegue ler, editar nem excluir matéria da Alice (404)', async () => {
    const created = await request(app).post('/subjects').set('Authorization', alice).send({ title: 'Privada' });
    const id = created.body.subject.subjectId;

    expect((await request(app).get(`/subjects/${id}`).set('Authorization', bob)).status).toBe(404);
    expect((await request(app).put(`/subjects/${id}`).set('Authorization', bob).send({ title: 'X' })).status).toBe(404);
    expect((await request(app).delete(`/subjects/${id}`).set('Authorization', bob)).status).toBe(404);

    expect((await request(app).get(`/subjects/${id}`).set('Authorization', alice)).status).toBe(200);
  });

  it('Excluir a matéria apaga em cascata suas notas e flashcards', async () => {
    const created = await request(app).post('/subjects').set('Authorization', alice).send({ title: 'Cascata' });
    const id = created.body.subject.subjectId;
    await db.collection('notes').add({ subjectId: id, title: 'n' });
    await db.collection('flashcards').add({ subjectId: id, front: 'f' });

    const response = await request(app).delete(`/subjects/${id}`).set('Authorization', alice);

    expect(response.status).toBe(200);
    expect(response.body.deleted).toEqual({ notes: 1, flashcards: 1 });
    expect((await db.collection('notes').where('subjectId', '==', id).get()).size).toBe(0);
  });
});