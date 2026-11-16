import request from 'supertest';
import app from '../../src/app.js';
import { clearAll } from '../helpers/emulator.js';
import { createTestUser } from '../helpers/auth.js';

describe('Integração - disponibilidade e troca de username (ponta a ponta)', () => {
  let alice, bob;

  beforeEach(async () => {
    await clearAll();
    alice = `Bearer ${(await createTestUser({ email: 'alice@teste.com' })).idToken}`;
    bob = `Bearer ${(await createTestUser({ email: 'bob@teste.com' })).idToken}`;
  });

  const check = (auth, name) => request(app).get(`/usernames/${name}/available`).set('Authorization', auth);
  const claim = (auth, username) => request(app).put('/me').set('Authorization', auth).send({ username });

  it('nome livre está disponível; inválido traz o motivo', async () => {
    expect((await check(alice, 'alice.dev')).body).toMatchObject({ success: true, available: true });

    const invalid = await check(alice, 'ab');
    expect(invalid.status).toBe(200);
    expect(invalid.body).toMatchObject({ available: false });
    expect(invalid.body.reason).toBeDefined();
  });

  it('depois que a Alice reserva, o Bob vê indisponível e a Alice vê disponível', async () => {
    expect((await claim(alice, 'alice.dev')).status).toBe(200);

    expect((await check(bob, 'alice.dev')).body.available).toBe(false);
    expect((await check(alice, 'alice.dev')).body.available).toBe(true);
  });

  it('PUT /me: 409 para nome em uso, uma troca permitida e a segunda bloqueada (403)', async () => {
    await claim(alice, 'alice.dev');

    const taken = await claim(bob, 'alice.dev');
    expect(taken.status).toBe(409);
    expect(taken.body.code).toBe('USERNAME_TAKEN');

    expect((await claim(alice, 'alice2')).status).toBe(200);
    const second = await claim(alice, 'alice3');
    expect(second.status).toBe(403);
  });

  it('GET /me reflete username, name e xp enxuto', async () => {
    await request(app).put('/me').set('Authorization', alice).send({ username: 'alice.dev', name: 'Alice' });

    const me = await request(app).get('/me').set('Authorization', alice);

    expect(me.body.user).toMatchObject({ username: 'alice.dev', name: 'Alice', xp: { total: 0, level: 1 } });
    expect(me.body.user.usage).toBeUndefined();
  });
});