import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/noteRepository.js', () => ({
  createNoteDb: jest.fn()
}));

jest.unstable_mockModule('../../src/repositories/flashcardRepository.js', () => ({
  createManyFlashcardsDb: jest.fn()
}));

jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn()
}));

import { generateFlashcardsForNote } from '../../src/services/notesService.js';
import { createManyFlashcardsDb } from '../../src/repositories/flashcardRepository.js';
import { generateFlashcardsFromText } from '../../src/services/aiClient.js';

describe('Notes Service - Geração e Persistência de Flashcards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve gerar flashcards via IA para uma nota existente e salvá-los no repositório', async () => {
    const mockSubjectId = '1';
    const mockNoteInput = {
      noteId: 'note-123',
      subjectId: '1',
      title: 'Nota de Teste',
      content: 'Conteúdo de teste para IA.',
      createdAt: new Date().toISOString()
    };

    const mockGeneratedCards = [
      { front: 'Pergunta 1?', back: 'Resposta 1' }
    ];

    const mockSavedCards = [
      { flashcardId: 'card-1', noteId: 'note-123', subjectId: '1', ...mockGeneratedCards[0] }
    ];

    generateFlashcardsFromText.mockResolvedValue(mockGeneratedCards);
    createManyFlashcardsDb.mockResolvedValue(mockSavedCards);

    const result = await generateFlashcardsForNote(mockSubjectId, mockNoteInput);

    expect(generateFlashcardsFromText).toHaveBeenCalledTimes(1);
    expect(createManyFlashcardsDb).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('flashcards');
    expect(result.flashcards).toEqual(mockSavedCards);
  });
});