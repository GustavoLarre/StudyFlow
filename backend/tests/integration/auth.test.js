import request from 'supertest';
import app from '../../src/app.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - Autenticação (GET /me)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('Deve responder 401 sem token', async () => {
    const response = await request(app).get('/me');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
  });

  it('Deve responder 401 com token inválido', async () => {
    const response = await request(app)
      .get('/me')
      .set('Authorization', 'Bearer token_falso');

    expect(response.status).toBe(401);
  });

  it('Deve criar o usuário no primeiro acesso com plano free, xp 0 e nível 1', async () => {
    const { uid, email, idToken } = await createTestUser();

    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${idToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ uid, email, plan: 'free', xp: 0, level: 1 });

    const snap = await db.collection('users').doc(uid).get();
    expect(snap.exists).toBe(true);
  });

  it('Não deve recriar o usuário no segundo acesso (mantém o xp)', async () => {
    const { uid, idToken } = await createTestUser();

    await request(app).get('/me').set('Authorization', `Bearer ${idToken}`);
    await db.collection('users').doc(uid).update({ xp: 50 });

    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${idToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.xp).toBe(50);
  });
});