import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/noteRepository.js', () => ({
  createNoteDb: jest.fn()
}));

jest.unstable_mockModule('../../src/repositories/flashcardRepository.js', () => ({
  createManyFlashcardsDb: jest.fn()
}));

jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn()
}));

const { generateFlashcardsForNote } = await import('../../src/services/notesService.js');
const { createManyFlashcardsDb } = await import('../../src/repositories/flashcardRepository.js');
const { generateFlashcardsFromText } = await import('../../src/services/aiClient.js');

describe('Notes Service - Geração e Persistência de Flashcards', () => {
  it('Deve gerar flashcards via IA para uma nota existente e salvá-los no repositório', async () => {
    const mockNoteInput = {
      noteId: 'note-123',
      subjectId: '1',
      title: 'Nota de Teste',
      content: 'Conteúdo de teste para IA.',
      createdAt: new Date().toISOString()
    };

    const mockGeneratedCards = [{ front: 'Pergunta 1?', back: 'Resposta 1' }];
    const mockSavedCards = [
      { flashcardId: 'card-1', noteId: 'note-123', subjectId: '1', ...mockGeneratedCards[0] }
    ];

    generateFlashcardsFromText.mockResolvedValue(mockGeneratedCards);
    createManyFlashcardsDb.mockResolvedValue(mockSavedCards);

    const result = await generateFlashcardsForNote('1', mockNoteInput);

    expect(generateFlashcardsFromText).toHaveBeenCalledTimes(1);
    expect(createManyFlashcardsDb).toHaveBeenCalledTimes(1);
    expect(result.flashcards).toEqual(mockSavedCards);
  });
});