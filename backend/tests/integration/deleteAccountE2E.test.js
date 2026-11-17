import request from 'supertest';
import app from '../../src/app.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - DELETE /me (ponta a ponta)', () => {
  let alice, bob, aliceUid, bobUid;

  const asAuth = (t) => `Bearer ${t}`;
  const count = async (col, uid) =>
    (await db.collection(col).where('userId', '==', uid).get()).size;

  beforeEach(async () => {
    await clearAll();
    const a = await createTestUser({ email: 'alice@teste.com' });
    const b = await createTestUser({ email: 'bob@teste.com' });
    alice = asAuth(a.idToken); aliceUid = a.uid;
    bob = asAuth(b.idToken); bobUid = b.uid;

    for (const [auth, username] of [[alice, 'alice.dev'], [bob, 'bob.dev']]) {
      await request(app).put('/me').set('Authorization', auth).send({ username, name: username });
      const s = await request(app).post('/subjects').set('Authorization', auth).send({ title: 'Redes' });
      const sid = s.body.subject.subjectId;
      await request(app).post(`/subjects/${sid}/notes`).set('Authorization', auth).send({ content: 'nota' });
      await request(app).post(`/subjects/${sid}/flashcards`).set('Authorization', auth).send({ front: 'P', back: 'R' });
      await request(app).post('/tasks').set('Authorization', auth).send({ date: '2026-12-01', text: 't' });
    }
  });

  it('apaga todos os dados da Alice, libera o username e remove a conta', async () => {
    const res = await request(app).delete('/me').set('Authorization', alice);

    expect(res.status).toBe(200);
    for (const col of ['subjects', 'notes', 'flashcards', 'tasks']) {
      expect(await count(col, aliceUid)).toBe(0);
    }
    expect((await db.collection('users').doc(aliceUid).get()).exists).toBe(false);
    expect((await db.collection('usernames').doc('alice.dev').get()).exists).toBe(false);

    // token da conta apagada deixa de funcionar
    expect((await request(app).get('/me').set('Authorization', alice)).status).toBe(401);
  });

  it('não toca nos dados do Bob', async () => {
    await request(app).delete('/me').set('Authorization', alice);

    for (const col of ['subjects', 'notes', 'flashcards', 'tasks']) {
      expect(await count(col, bobUid)).toBe(1);
    }
    expect((await db.collection('usernames').doc('bob.dev').get()).exists).toBe(true);
  });
});