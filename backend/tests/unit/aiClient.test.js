import { jest, describe, it, expect } from '@jest/globals';
import { generateFlashcardsFromText } from '../../src/services/aiClient.js';
import { BadGatewayError, GatewayTimeoutError } from '../../src/errors/AppError.js';

const okFetch = (body) =>
  jest.fn().mockResolvedValue({ ok: true, json: async () => body });

describe('AI Client Service - Integração com ai-service', () => {
  it('Deve enviar o texto ao ai-service e retornar os flashcards', async () => {
    const mockFetch = okFetch({ flashcards: [{ front: 'O que é TDD?', back: 'Test-Driven Development' }] });

    const result = await generateFlashcardsFromText('Título', 'Conteúdo', mockFetch);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ front: 'O que é TDD?', back: 'Test-Driven Development' }]);
  });

  it('Deve chamar a porta 8000 por padrão, com POST JSON e signal de timeout', async () => {
    const mockFetch = okFetch({ flashcards: [{ front: 'a', back: 'b' }] });

    await generateFlashcardsFromText('T', 'C', mockFetch);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8000/generate-flashcards');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ title: 'T', content: 'C' });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('Deve usar o fetch global por padrão', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = okFetch({ flashcards: [{ front: 'P?', back: 'R.' }] });

    try {
      const result = await generateFlashcardsFromText('T', 'C');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ front: 'P?', back: 'R.' }]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('Deve lançar BadGatewayError quando o ai-service responde erro HTTP', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false, status: 500, text: async () => 'Internal Server Error'
    });

    await expect(generateFlashcardsFromText('T', 'C', mockFetch)).rejects.toBeInstanceOf(BadGatewayError);
    spy.mockRestore();
  });

  it('Deve lançar BadGatewayError quando o ai-service está fora do ar', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

    await expect(generateFlashcardsFromText('T', 'C', mockFetch)).rejects.toBeInstanceOf(BadGatewayError);
    spy.mockRestore();
  });

  it('Deve lançar GatewayTimeoutError quando estoura o timeout', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const mockFetch = jest.fn().mockRejectedValue(timeout);

    await expect(generateFlashcardsFromText('T', 'C', mockFetch)).rejects.toBeInstanceOf(GatewayTimeoutError);
    spy.mockRestore();
  });

  it('Deve lançar BadGatewayError quando não vêm flashcards válidos', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      generateFlashcardsFromText('T', 'C', okFetch({ flashcards: [] }))
    ).rejects.toBeInstanceOf(BadGatewayError);
    await expect(
      generateFlashcardsFromText('T', 'C', okFetch({}))
    ).rejects.toBeInstanceOf(BadGatewayError);
    spy.mockRestore();
  });

  it('Não deve vazar detalhes internos na mensagem', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false, status: 500, text: async () => 'traceback secreto'
    });

    await expect(generateFlashcardsFromText('T', 'C', mockFetch))
      .rejects.toThrow(expect.objectContaining({ message: expect.not.stringContaining('secreto') }));
    spy.mockRestore();
  });
});