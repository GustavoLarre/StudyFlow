import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/middlewares/firebaseAuth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { uid: 'user_teste', plan: 'free', xp: 0, level: 1 };
    next();
  }
}));

jest.unstable_mockModule('../../src/services/progressService.js', () => ({
  getProgress: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const service = await import('../../src/services/progressService.js');

describe('Integração - Progresso (rota)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /progress responde 200 com xp e subjects do usuário', async () => {
    service.getProgress.mockResolvedValue({
      xp: { total: 120, level: 2, currentLevelXp: 20, nextLevelXp: 200 },
      subjects: [{ subjectId: 's1', title: 'Redes', total: 0, stats: { muitoFacil: 0, facil: 0, medio: 0, dificil: 0 } }]
    });

    const response = await request(app).get('/progress');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, xp: { level: 2 }, subjects: [{ title: 'Redes' }] });
    expect(service.getProgress).toHaveBeenCalledWith('user_teste');
  });

  it('Erro inesperado responde 500', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    service.getProgress.mockRejectedValue(new Error('falha'));

    const response = await request(app).get('/progress');

    expect(response.status).toBe(500);
    spy.mockRestore();
  });
});