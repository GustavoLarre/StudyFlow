import { jest } from '@jest/globals';
import { generateFlashcardsFromText } from '../../src/services/aiClient.js';
import fetch from 'node-fetch';

jest.mock('node-fetch');

describe('AI Client Service - Integração com ai-service', () => {
  it('Deve enviar o texto para o ai-service e retornar os flashcards parseados', async () => {
    const mockCards = [
      { front: 'O que é BSS?', back: 'Segmento de dados não inicializados em C.' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ flashcards: mockCards })
    });

    const result = await generateFlashcardsFromText('Texto da nota sobre memória C');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockCards);
  });
});