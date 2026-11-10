import { jest } from '@jest/globals';
import request from 'supertest';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn()
}));

describe('Integração - Geração de flashcards por IA (ponta a ponta)', () => {
  let app, db, ai, BadGatewayError;
  let alice, bob, aliceUid, noteId, note;

  beforeAll(async () => {
    app = (await import('../../src/app.js')).default;
    db = (await import('../../src/config/firebase.js')).db;
    ai = (await import('../../src/services/aiClient.js')).generateFlashcardsFromText;
    BadGatewayError = (await import('../../src/errors/AppError.js')).BadGatewayError;
  });

  beforeEach(async () => {
    await clearAll();
    const a = await createTestUser({ email: 'alice@teste.com' });
    alice = `Bearer ${a.idToken}`;
    aliceUid = a.uid;
    bob = `Bearer ${(await createTestUser({ email: 'bob@teste.com' })).idToken}`;

    const subject = await request(app).post('/subjects').set('Authorization', alice).send({ title: 'Redes' });
    const created = await request(app)
      .post(`/subjects/${subject.body.subject.subjectId}/notes`)
      .set('Authorization', alice)
      .send({ title: 'HTTP', content: 'HTTP opera na camada de aplicação.' });
    noteId = created.body.note.noteId;
    note = created.body.note;

    ai.mockResolvedValue([
      { front: 'Onde opera o HTTP?', back: 'Na camada de aplicação.' },
      { front: 'Quem usa HTTP?', back: 'Clientes e servidores web.' }
    ]);
  });

  const generate = (auth, id = noteId) =>
    request(app).post(`/notes/${id}/generate-flashcards`).set('Authorization', auth).send();

  it('Gera cards source ai, +1 XP por card, e deixa a nota intacta', async () => {
    const response = await generate(alice);

    expect(response.status).toBe(201);
    expect(response.body.flashcards).toHaveLength(2);
    expect(response.body.flashcards[0]).toMatchObject({
      source: 'ai', rating: null, state: 'new', noteId, userId: aliceUid
    });
    expect(response.body.gamification).toMatchObject({ gainedXp: 2, totalXp: 2 });
    expect(response.body.usage).toEqual({ count: 1, limit: 3 });

    const after = (await db.collection('notes').doc(noteId).get()).data();
    expect(after.content).toBe(note.content);
    expect(after.updatedAt).toBe(note.updatedAt);

    const user = (await db.collection('users').doc(aliceUid).get()).data();
    expect(user.usage.aiInFlight).toBeNull();
  });

  it('Bloqueia a 4ª geração do plano free com 403', async () => {
    for (let i = 0; i < 3; i++) {
      expect((await generate(alice)).status).toBe(201);
    }

    const fourth = await generate(alice);

    expect(fourth.status).toBe(403);
    expect(fourth.body.code).toBe('PLAN_LIMIT_REACHED');
    expect(ai).toHaveBeenCalledTimes(3);
  });

  it('Devolve a cota quando o ai-service falha (502)', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    ai.mockRejectedValueOnce(new BadGatewayError());

    const failed = await generate(alice);
    expect(failed.status).toBe(502);

    const user = (await db.collection('users').doc(aliceUid).get()).data();
    expect(user.usage.aiGenerations.count).toBe(0);
    expect(user.usage.aiInFlight).toBeNull();

    expect((await generate(alice)).status).toBe(201);
    spy.mockRestore();
  });

  it('Segunda geração durante uma em andamento recebe 409', async () => {
    let release;
    ai.mockImplementation(() => new Promise((resolve) => {
      release = () => resolve([{ front: 'P?', back: 'R.' }]);
    }));

    const first = generate(alice).then((r) => r); // inicia e fica presa na IA
    // espera a IA ser chamada (primeira já reservou a trava)
    while (ai.mock.calls.length === 0) {
     await new Promise((r) => setTimeout(r, 20));
    }

    const second = await generate(alice);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('AI_GENERATION_IN_PROGRESS');

   release();
   expect((await first).status).toBe(201);
  });

  it('Usuários diferentes geram ao mesmo tempo sem se bloquear', async () => {
    const bobSubject = await request(app).post('/subjects').set('Authorization', bob).send({ title: 'BD' });
    const bobNote = await request(app)
      .post(`/subjects/${bobSubject.body.subject.subjectId}/notes`)
      .set('Authorization', bob)
      .send({ content: 'SQL é uma linguagem.' });
    ai.mockImplementation(() => new Promise((resolve) =>
      setTimeout(() => resolve([{ front: 'P?', back: 'R.' }]), 300)));

    const results = await Promise.all([
      generate(alice),
      generate(bob, bobNote.body.note.noteId)
    ]);

    expect(results.map((r) => r.status)).toEqual([201, 201]);
  });

  it('Bob não gera a partir da nota da Alice (404) e não consome cota', async () => {
    const response = await generate(bob);

    expect(response.status).toBe(404);
    expect(ai).not.toHaveBeenCalled();
  });
});