import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const state = { auth: { auth_time: Math.floor(Date.now() / 1000) } };
jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => { req.user = { uid: 'u1' }; req.auth = state.auth; next(); }
}));
jest.unstable_mockModule('../../src/services/accountService.js', () => ({ deleteAccount: jest.fn() }));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const { deleteAccount } = await import('../../src/services/accountService.js');

describe('Integração - DELETE /me (rota)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('login recente apaga a conta', async () => {
    state.auth = { auth_time: Math.floor(Date.now() / 1000) };
    const res = await request(app).delete('/me');
    expect(res.status).toBe(200);
    expect(deleteAccount).toHaveBeenCalledWith('u1', expect.any(Object));
  });

  it('login antigo responde 401 REAUTH_REQUIRED e não apaga nada', async () => {
    state.auth = { auth_time: Math.floor(Date.now() / 1000) - 3600 };
    const res = await request(app).delete('/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('REAUTH_REQUIRED');
    expect(deleteAccount).not.toHaveBeenCalled();
  });
});