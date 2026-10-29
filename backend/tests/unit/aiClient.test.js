import { jest } from '@jest/globals';
import { generateFlashcardsFromText } from '../../src/services/aiClient.js';

describe('AI Client Service - Integração com ai-service', () => {
  it('Deve enviar o texto para o ai-service e retornar os flashcards parseados com sucesso', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        flashcards: [{ front: 'O que é TDD?', back: 'Test-Driven Development' }]
      })
    });

    const result = await generateFlashcardsFromText('Título', 'Conteúdo', mockFetch);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ front: 'O que é TDD?', back: 'Test-Driven Development' }]);
  });

  it('Deve lançar um erro caso o ai-service retorne falha', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    await expect(
      generateFlashcardsFromText('Título', 'Conteúdo', mockFetch)
    ).rejects.toThrow('Não foi possível gerar os flashcards via IA no momento. Tente novamente mais tarde.');
  });

  // Item 0.2
  it('Deve usar o fetch global do Node por padrão (sem node-fetch)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards: [{ front: 'P?', back: 'R.' }] })
    });

    try {
      const result = await generateFlashcardsFromText('Título', 'Conteúdo');

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ front: 'P?', back: 'R.' }]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // Item 0.3
  it('Deve chamar o ai-service na porta 8000 por padrão', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards: [{ front: 'a', back: 'b' }] })
    });

    await generateFlashcardsFromText('Título', 'Conteúdo', mockFetch);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8000/generate-flashcards');
  });
});