import request from 'supertest';
import app from '../../src/app.js';

describe('Integração - CORS', () => {
  it('Libera a origem do frontend no preflight, inclusive com Authorization', async () => {
    const response = await request(app)
      .options('/subjects')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-headers'].toLowerCase()).toContain('authorization');
  });

  it('Não libera origens desconhecidas', async () => {
    const response = await request(app)
      .options('/subjects')
      .set('Origin', 'http://site-malicioso.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('O preflight não exige token (responde antes do authenticate)', async () => {
    const response = await request(app)
      .options('/tasks')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).not.toBe(401);
  });
});