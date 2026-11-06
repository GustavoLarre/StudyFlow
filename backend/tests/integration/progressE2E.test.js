import request from 'supertest';
import app from '../../src/app.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - Progresso ponta a ponta', () => {
  let alice, bob;

  const subject = async (auth, title) =>
    (await request(app).post('/subjects').set('Authorization', auth).send({ title })).body.subject.subjectId;
  const card = async (auth, subjectId, front) =>
    (await request(app).post(`/subjects/${subjectId}/flashcards`).set('Authorization', auth)
      .send({ front, back: 'R' })).body.flashcard.flashcardId;
  const review = (auth, id, action) =>
    request(app).post(`/flashcards/${id}/review`).set('Authorization', auth).send({ action });

  beforeEach(async () => {
    await clearAll();
    alice = `Bearer ${(await createTestUser({ email: 'alice@teste.com' })).idToken}`;
    bob = `Bearer ${(await createTestUser({ email: 'bob@teste.com' })).idToken}`;
  });

  it('Usuário novo: XP zerado e nenhuma matéria', async () => {
    const response = await request(app).get('/progress').set('Authorization', alice);

    expect(response.status).toBe(200);
    expect(response.body.xp).toEqual({ total: 0, level: 1, currentLevelXp: 0, nextLevelXp: 100 });
    expect(response.body.subjects).toEqual([]);
  });

  it('Diagnóstico por matéria reflete os ratings, e matéria vazia aparece zerada', async () => {
    const a = await subject(alice, 'A');
    await subject(alice, 'Vazia');
    const c1 = await card(alice, a, 'c1');
    const c2 = await card(alice, a, 'c2');
    await card(alice, a, 'c3'); // nasce em difícil

    await review(alice, c1, 'easy'); // rating 4
    await review(alice, c2, 'good'); // rating 3

    const response = await request(app).get('/progress').set('Authorization', alice);
    const byTitle = Object.fromEntries(response.body.subjects.map((s) => [s.title, s]));

    expect(byTitle.A.stats).toEqual({ muitoFacil: 1, facil: 1, medio: 0, dificil: 1 });
    expect(byTitle.A.total).toBe(3);
    expect(byTitle.Vazia.stats).toEqual({ muitoFacil: 0, facil: 0, medio: 0, dificil: 0 });
  });

  it('XP total soma criação e revisão', async () => {
    const a = await subject(alice, 'A');
    const id = await card(alice, a, 'c1'); // +1
    await review(alice, id, 'easy');       // +4

    const response = await request(app).get('/progress').set('Authorization', alice);

    expect(response.body.xp).toMatchObject({ total: 5, level: 1, currentLevelXp: 5 });
  });

  it('Bob não vê matérias nem cards da Alice', async () => {
    const a = await subject(alice, 'A');
    await card(alice, a, 'c1');

    const response = await request(app).get('/progress').set('Authorization', bob);

    expect(response.body.subjects).toEqual([]);
    expect(response.body.xp.total).toBe(0);
  });
});