import { jest } from '@jest/globals';

// Define os mocks antes de importar o service
jest.unstable_mockModule('../../src/repositories/noteRepository.js', () => ({
  createNoteDb: jest.fn()
}));

jest.unstable_mockModule('../../src/repositories/flashcardRepository.js', () => ({
  createManyFlashcardsDb: jest.fn()
}));

jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn()
}));

// Importações dinâmicas após os mocks no ESM
const noteRepository = await import('../../src/repositories/noteRepository.js');
const flashcardRepository = await import('../../src/repositories/flashcardRepository.js');
const aiClient = await import('../../src/services/aiClient.js');
const { generateFlashcardsForNote } = await import('../../src/services/notesService.js');

describe('Notes Service - Geração e Persistência de Flashcards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve salvar a nota no Firestore, gerar flashcards via IA e salvá-los no repositório', async () => {
    const mockSubjectId = 'sub_123';
    const mockNoteData = {
      title: 'Arquitetura de Computadores',
      content: 'Pipeline de execução e hierarquia de memória.'
    };

    noteRepository.createNoteDb.mockResolvedValueOnce({
      noteId: 'note_abc_123',
      subjectId: mockSubjectId,
      ...mockNoteData
    });

    aiClient.generateFlashcardsFromText.mockResolvedValueOnce([
      { front: 'O que é pipeline?', back: 'Técnica de sobreposição de instruções.' }
    ]);

    flashcardRepository.createManyFlashcardsDb.mockResolvedValueOnce([
      { flashcardId: 'card_1', noteId: 'note_abc_123', front: 'O que é pipeline?', back: 'Técnica de sobreposição de instruções.' }
    ]);

    const result = await generateFlashcardsForNote(mockSubjectId, mockNoteData);

    expect(noteRepository.createNoteDb).toHaveBeenCalledTimes(1);
    expect(aiClient.generateFlashcardsFromText).toHaveBeenCalledTimes(1);
    expect(flashcardRepository.createManyFlashcardsDb).toHaveBeenCalledTimes(1);
    
    expect(result).toHaveProperty('noteId', 'note_abc_123');
    expect(result).toHaveProperty('flashcards');
    expect(result.flashcards.length).toBe(1);
  });
});