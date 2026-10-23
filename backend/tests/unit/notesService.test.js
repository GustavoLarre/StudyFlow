import { describe, it, expect } from '@jest/globals';
import { generateFlashcardsForNote } from '../../src/services/notesService.js';

describe('Notes Service - Geração de Flashcards', () => {
  it('Deve lançar um erro se a nota ultrapassar o limite máximo de 6000 caracteres', async () => {
    const hugeNote = {
      title: 'Nota Gigante',
      content: 'a'.repeat(6001)
    };
    const mockNoteId = 'note_123';

    await expect(generateFlashcardsForNote(mockNoteId, hugeNote))
      .rejects
      .toThrow('A nota ultrapassa o limite máximo de 6000 caracteres');
  });

  it('Deve processar o título e conteúdo da nota, chamar o aiClient e retornar os flashcards vinculados', async () => {
    const mockNoteId = 'note_123';
    const mockNote = {
      title: 'Introdução ao TDD',
      content: 'O TDD possui três fases principais: Red, Green e Refactor.'
    };

    const fakeAiClient = {
      generateFlashcardsFromText: async (textToSend) => {
        // Opcional: podemos garantir que a IA recebeu o contexto ou título se quisermos enriquecer o prompt
        return [
          { front: 'Quais são as fases do TDD?', back: 'Red, Green e Refactor.' }
        ];
      }
    };

    const flashcards = await generateFlashcardsForNote(mockNoteId, mockNote, fakeAiClient);

    expect(Array.isArray(flashcards)).toBe(true);
    expect(flashcards.length).toBeGreaterThan(0);
    expect(flashcards[0]).toHaveProperty('noteId', mockNoteId);
    expect(flashcards[0]).toHaveProperty('front');
    expect(flashcards[0]).toHaveProperty('back');
  });
});