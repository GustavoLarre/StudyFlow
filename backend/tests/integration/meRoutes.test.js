import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { uid: 'user_teste' };
    next();
  }
}));
jest.unstable_mockModule('../../src/services/profileService.js', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const service = await import('../../src/services/profileService.js');
const { ValidationError, ForbiddenError, UsernameTakenError } = await import('../../src/errors/AppError.js');

describe('Integração - /me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /me devolve o perfil enxuto', async () => {
    service.getProfile.mockResolvedValue({ uid: 'user_teste', username: 'g', xp: { total: 0 } });

    const response = await request(app).get('/me');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, user: { uid: 'user_teste', username: 'g', xp: { total: 0 } } });
    expect(service.getProfile).toHaveBeenCalledWith('user_teste');
  });

  it('PUT /me atualiza e devolve o perfil', async () => {
    service.updateProfile.mockResolvedValue({ uid: 'user_teste', username: 'novo' });

    const response = await request(app).put('/me').send({ username: 'novo', name: 'N' });

    expect(response.status).toBe(200);
    expect(service.updateProfile).toHaveBeenCalledWith('user_teste', { username: 'novo', name: 'N' });
  });

  it.each([
    [new ValidationError('inválido'), 400, undefined],
    [new ForbiddenError('só uma troca'), 403, 'FORBIDDEN'],
    [new UsernameTakenError(), 409, 'USERNAME_TAKEN']
  ])('PUT /me mapeia erro %#', async (error, status, code) => {
    service.updateProfile.mockRejectedValue(error);

    const response = await request(app).put('/me').send({ username: 'x' });

    expect(response.status).toBe(status);
    expect(response.body.code).toBe(code);
  });
});