import request from 'supertest';
import app from '../../src/app.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - Flashcards ponta a ponta', () => {
  let alice, bob, aliceUid, subjectId;

  beforeAll(async () => {
    await clearAll();
    const a = await createTestUser({ email: 'alice@teste.com' });
    alice = `Bearer ${a.idToken}`;
    aliceUid = a.uid;
    bob = `Bearer ${(await createTestUser({ email: 'bob@teste.com' })).idToken}`;

    const subject = await request(app).post('/subjects').set('Authorization', alice).send({ title: 'Redes' });
    subjectId = subject.body.subject.subjectId;
  });

  it('CRUD completo, com defaults e +1 XP na criação', async () => {
    const created = await request(app)
      .post(`/subjects/${subjectId}/flashcards`)
      .set('Authorization', alice)
      .send({ front: 'O que é HTTP?', back: 'Protocolo de aplicação.' });

    expect(created.status).toBe(201);
    expect(created.body.flashcard).toMatchObject({ source: 'manual', rating: null, state: 'new', userId: aliceUid });
    expect(created.body.gamification).toMatchObject({ gainedXp: 1, totalXp: 1, level: 1 });
    expect((await db.collection('users').doc(aliceUid).get()).data().xp).toBe(1);

    const id = created.body.flashcard.flashcardId;

    const list = await request(app).get(`/subjects/${subjectId}/flashcards`).set('Authorization', alice);
    expect(list.body.flashcards.map((c) => c.flashcardId)).toContain(id);

    const updated = await request(app).put(`/flashcards/${id}`).set('Authorization', alice).send({ back: 'Novo' });
    expect(updated.body.flashcard.back).toBe('Novo');

    expect((await request(app).delete(`/flashcards/${id}`).set('Authorization', alice)).status).toBe(200);
    expect((await request(app).get(`/flashcards/${id}`).set('Authorization', alice)).status).toBe(404);
  });

  it('Bob não cria, lista, lê, edita nem exclui nada da Alice (404)', async () => {
    const created = await request(app)
      .post(`/subjects/${subjectId}/flashcards`)
      .set('Authorization', alice)
      .send({ front: 'P', back: 'R' });
    const id = created.body.flashcard.flashcardId;

    expect((await request(app).post(`/subjects/${subjectId}/flashcards`).set('Authorization', bob).send({ front: 'x', back: 'y' })).status).toBe(404);
    expect((await request(app).get(`/subjects/${subjectId}/flashcards`).set('Authorization', bob)).status).toBe(404);
    expect((await request(app).get(`/flashcards/${id}`).set('Authorization', bob)).status).toBe(404);
    expect((await request(app).put(`/flashcards/${id}`).set('Authorization', bob).send({ front: 'X' })).status).toBe(404);
    expect((await request(app).delete(`/flashcards/${id}`).set('Authorization', bob)).status).toBe(404);
  });

  it('Aceita noteId só se a nota for da mesma matéria e do usuário', async () => {
    const note = await request(app)
      .post(`/subjects/${subjectId}/notes`)
      .set('Authorization', alice)
      .send({ content: 'Fonte' });
    const noteId = note.body.note.noteId;

    const ok = await request(app)
      .post(`/subjects/${subjectId}/flashcards`)
      .set('Authorization', alice)
      .send({ front: 'P', back: 'R', noteId });
    expect(ok.status).toBe(201);
    expect(ok.body.flashcard.noteId).toBe(noteId);

    const bad = await request(app)
      .post(`/subjects/${subjectId}/flashcards`)
      .set('Authorization', alice)
      .send({ front: 'P', back: 'R', noteId: 'nota_inexistente' });
    expect(bad.status).toBe(404);
  });
});