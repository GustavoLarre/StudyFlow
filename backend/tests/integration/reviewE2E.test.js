import request from 'supertest';
import app from '../../src/app.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - Revisão ponta a ponta', () => {
  let alice, bob, aliceUid, subjectA, subjectB;

  const createCard = async (auth, subjectId, front) =>
    (await request(app).post(`/subjects/${subjectId}/flashcards`).set('Authorization', auth)
      .send({ front, back: 'R' })).body.flashcard.flashcardId;

  beforeEach(async () => {
    await clearAll();
    const a = await createTestUser({ email: 'alice@teste.com' });
    alice = `Bearer ${a.idToken}`;
    aliceUid = a.uid;
    bob = `Bearer ${(await createTestUser({ email: 'bob@teste.com' })).idToken}`;

    subjectA = (await request(app).post('/subjects').set('Authorization', alice).send({ title: 'A' })).body.subject.subjectId;
    subjectB = (await request(app).post('/subjects').set('Authorization', alice).send({ title: 'B' })).body.subject.subjectId;
  });

  it('Card novo aparece vencido; filtro por matéria e mistura funcionam', async () => {
    await createCard(alice, subjectA, 'a1');
    await createCard(alice, subjectB, 'b1');

    const all = await request(app).get('/review/due').set('Authorization', alice);
    const onlyA = await request(app).get(`/review/due?subjectId=${subjectA}`).set('Authorization', alice);

    expect(all.body.total).toBe(2);
    expect(onlyA.body.flashcards.map((c) => c.front)).toEqual(['a1']);
  });

  it('Revisar grava estado, rating e XP; o card sai da fila (vence em minutos)', async () => {
    const id = await createCard(alice, subjectA, 'a1');

    const result = await request(app).post(`/flashcards/${id}/review`).set('Authorization', alice).send({ action: 'easy' });

    expect(result.status).toBe(200);
    expect(result.body.flashcard).toMatchObject({ state: 'review', interval: 4, rating: 4 });
    expect(result.body.gamification.gainedXp).toBe(4);

    // 1 XP da criação + 4 da revisão
    expect((await db.collection('users').doc(aliceUid).get()).data().xp).toBe(5);

    const due = await request(app).get('/review/due').set('Authorization', alice);
    expect(due.body.total).toBe(0);
  });

  it('Revisar de novo um card ainda não vencido não rende XP (anti-farm)', async () => {
    const id = await createCard(alice, subjectA, 'a1');
    await request(app).post(`/flashcards/${id}/review`).set('Authorization', alice).send({ action: 'easy' });

    const again = await request(app).post(`/flashcards/${id}/review`).set('Authorization', alice).send({ action: 'easy' });

    expect(again.status).toBe(200);
    expect(again.body.gamification.gainedXp).toBe(0);
  });

  it('Ação inválida responde 400 e card alheio 404', async () => {
    const id = await createCard(alice, subjectA, 'a1');

    expect((await request(app).post(`/flashcards/${id}/review`).set('Authorization', alice).send({ action: 'perfect' })).status).toBe(400);
    expect((await request(app).post(`/flashcards/${id}/review`).set('Authorization', bob).send({ action: 'good' })).status).toBe(404);
  });

  it('Bob não vê os vencidos da Alice nem filtra pela matéria dela', async () => {
    await createCard(alice, subjectA, 'a1');

    const mine = await request(app).get('/review/due').set('Authorization', bob);
    const foreign = await request(app).get(`/review/due?subjectId=${subjectA}`).set('Authorization', bob);

    expect(mine.body.total).toBe(0);
    expect(foreign.status).toBe(404);
  });
});