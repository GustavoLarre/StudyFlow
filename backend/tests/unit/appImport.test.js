import { jest, describe, it, expect } from '@jest/globals';
import http from 'node:http';

describe('Unidade - Importação do app', () => {
  it('Não deve abrir porta ao importar o app (sem efeito colateral de listen)', async () => {
    const listenSpy = jest.spyOn(http.Server.prototype, 'listen');

    await import('../../src/app.js');

    expect(listenSpy).not.toHaveBeenCalled();
  });

  it('Deve exportar o app como default', async () => {
    const { default: app } = await import('../../src/app.js');

    expect(typeof app).toBe('function'); // app do Express é uma função (req, res)
  });
});