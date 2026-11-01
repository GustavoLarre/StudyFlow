import request from 'supertest';
import app from '../../src/app.js';
import { clearAll } from '../helpers/emulator.js';

describe('Integração - Proteção global das rotas', () => {
  beforeAll(async () => {
    await clearAll();
  });

  it('GET /health deve continuar público', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
  });

  const protectedRoutes = [
    ['get', '/me'],
    ['get', '/subjects'],
    ['post', '/subjects'],
    ['get', '/subjects/abc/notes'],
    ['post', '/subjects/abc/notes'],
    ['post', '/notes/abc/generate-flashcards'],
    ['post', '/notes/abc/flashcards'],
    ['post', '/flashcards/abc/review'],
    ['get', '/review/due'],
    ['get', '/tasks'],
    ['post', '/tasks'],
    ['patch', '/tasks/abc/complete']
  ];

  it.each(protectedRoutes)('%s %s deve responder 401 sem token', async (method, path) => {
    const response = await request(app)[method](path);

    expect(response.status).toBe(401);
  });

  it('Rota inexistente sem token também responde 401 (não vaza quais rotas existem)', async () => {
    const response = await request(app).get('/rota-que-nao-existe');

    expect(response.status).toBe(401);
  });
});