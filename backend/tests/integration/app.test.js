import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('Infraestrutura Inicial do Express (Sanity Check)', () => {
  it('Deve responder com status 200 e mensagem de status da API na rota GET /health', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });
});