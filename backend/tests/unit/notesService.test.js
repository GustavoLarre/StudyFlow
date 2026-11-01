import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/noteRepository.js', () => ({
  createNoteDb: jest.fn(),
  getNotesBySubjectDb: jest.fn(),
  getNoteByIdDb: jest.fn(),
  updateNoteDb: jest.fn(),
  deleteNoteDb: jest.fn()
}));

jest.unstable_mockModule('../../src/repositories/subjectRepository.js', () => ({
  getSubjectByIdDb: jest.fn()
}));

jest.unstable_mockModule('../../src/repositories/flashcardRepository.js', () => ({
  createManyFlashcardsDb: jest.fn()
}));

jest.unstable_mockModule('../../src/services/aiClient.js', () => ({
  generateFlashcardsFromText: jest.fn()
}));

const noteRepository = await import('../../src/repositories/noteRepository.js');
const subjectRepository = await import('../../src/repositories/subjectRepository.js');
const { createManyFlashcardsDb } = await import('../../src/repositories/flashcardRepository.js');
const { generateFlashcardsFromText } = await import('../../src/services/aiClient.js');
const {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
  generateFlashcardsForNote,
  MAX_NOTE_CHARS
} = await import('../../src/services/notesService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

const OWN_SUBJECT = { subjectId: 's1', userId: 'u1', title: 'Minha' };
const OTHERS_SUBJECT = { subjectId: 's2', userId: 'u2', title: 'De outro' };
const OWN_NOTE = { noteId: 'n1', userId: 'u1', subjectId: 's1', title: 'T', content: 'c' };
const OTHERS_NOTE = { noteId: 'n2', userId: 'u2', subjectId: 's2', title: 'T', content: 'c' };

describe('Unidade - notesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('Deve criar com userId, subjectId, título aparado e datas', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OWN_SUBJECT);
      noteRepository.createNoteDb.mockImplementation(async (d) => ({ noteId: 'n1', ...d }));

      const result = await createNote({
        userId: 'u1', subjectId: 's1', title: '  Grafos ', content: 'Conteúdo'
      });

      expect(noteRepository.createNoteDb).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', subjectId: 's1', title: 'Grafos', content: 'Conteúdo' })
      );
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
    });

    it('Deve usar "Nota sem título" quando o título não é informado', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OWN_SUBJECT);
      noteRepository.createNoteDb.mockImplementation(async (d) => ({ noteId: 'n1', ...d }));

      const result = await createNote({ userId: 'u1', subjectId: 's1', content: 'c' });

      expect(result.title).toBe('Nota sem título');
    });

    it.each([[undefined], [''], ['   '], [123]])('Deve rejeitar conteúdo inválido (%p)', async (content) => {
      await expect(
        createNote({ userId: 'u1', subjectId: 's1', content })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(noteRepository.createNoteDb).not.toHaveBeenCalled();
    });

    it('Deve aceitar exatamente o limite e rejeitar um caractere a mais', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OWN_SUBJECT);
      noteRepository.createNoteDb.mockImplementation(async (d) => ({ noteId: 'n1', ...d }));

      await expect(
        createNote({ userId: 'u1', subjectId: 's1', content: 'a'.repeat(MAX_NOTE_CHARS) })
      ).resolves.toBeDefined();

      await expect(
        createNote({ userId: 'u1', subjectId: 's1', content: 'a'.repeat(MAX_NOTE_CHARS + 1) })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('Deve rejeitar título com mais de 150 caracteres', async () => {
      await expect(
        createNote({ userId: 'u1', subjectId: 's1', title: 'a'.repeat(151), content: 'c' })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('Deve lançar NotFoundError para matéria de outro usuário ou inexistente', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValueOnce(OTHERS_SUBJECT);
      await expect(
        createNote({ userId: 'u1', subjectId: 's2', content: 'c' })
      ).rejects.toBeInstanceOf(NotFoundError);

      subjectRepository.getSubjectByIdDb.mockResolvedValueOnce(null);
      await expect(
        createNote({ userId: 'u1', subjectId: 'x', content: 'c' })
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(noteRepository.createNoteDb).not.toHaveBeenCalled();
    });
  });

  describe('listNotes', () => {
    it('Deve listar as notas de uma matéria do usuário', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OWN_SUBJECT);
      noteRepository.getNotesBySubjectDb.mockResolvedValue([OWN_NOTE]);

      const result = await listNotes({ userId: 'u1', subjectId: 's1' });

      expect(noteRepository.getNotesBySubjectDb).toHaveBeenCalledWith('s1');
      expect(result).toEqual([OWN_NOTE]);
    });

    it('Não deve listar notas de matéria de outro usuário', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OTHERS_SUBJECT);

      await expect(
        listNotes({ userId: 'u1', subjectId: 's2' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(noteRepository.getNotesBySubjectDb).not.toHaveBeenCalled();
    });
  });

  describe('getNote', () => {
    it('Deve retornar a nota própria', async () => {
      noteRepository.getNoteByIdDb.mockResolvedValue(OWN_NOTE);

      expect(await getNote({ userId: 'u1', noteId: 'n1' })).toEqual(OWN_NOTE);
    });

    it('Deve lançar NotFoundError para nota inexistente ou de outro usuário', async () => {
      noteRepository.getNoteByIdDb.mockResolvedValueOnce(null);
      await expect(getNote({ userId: 'u1', noteId: 'x' })).rejects.toBeInstanceOf(NotFoundError);

      noteRepository.getNoteByIdDb.mockResolvedValueOnce(OTHERS_NOTE);
      await expect(getNote({ userId: 'u1', noteId: 'n2' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateNote', () => {
    it('Deve atualizar título e conteúdo e renovar o updatedAt', async () => {
      noteRepository.getNoteByIdDb.mockResolvedValue(OWN_NOTE);
      noteRepository.updateNoteDb.mockImplementation(async (id, d) => ({ ...OWN_NOTE, ...d }));

      const result = await updateNote({
        userId: 'u1', noteId: 'n1', title: ' Novo ', content: 'Novo conteúdo'
      });

      expect(noteRepository.updateNoteDb).toHaveBeenCalledWith(
        'n1',
        expect.objectContaining({ title: 'Novo', content: 'Novo conteúdo', updatedAt: expect.any(String) })
      );
      expect(result.title).toBe('Novo');
    });

    it('Deve permitir atualizar só o título, sem tocar no conteúdo', async () => {
      noteRepository.getNoteByIdDb.mockResolvedValue(OWN_NOTE);
      noteRepository.updateNoteDb.mockImplementation(async (id, d) => ({ ...OWN_NOTE, ...d }));

      await updateNote({ userId: 'u1', noteId: 'n1', title: 'Só título' });

      const [, data] = noteRepository.updateNoteDb.mock.calls[0];
      expect(data).not.toHaveProperty('content');
    });

    it('Deve exigir título ou conteúdo', async () => {
      await expect(
        updateNote({ userId: 'u1', noteId: 'n1' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(noteRepository.updateNoteDb).not.toHaveBeenCalled();
    });

    it('Deve aplicar o limite de caracteres também na atualização', async () => {
      await expect(
        updateNote({ userId: 'u1', noteId: 'n1', content: 'a'.repeat(MAX_NOTE_CHARS + 1) })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(noteRepository.updateNoteDb).not.toHaveBeenCalled();
    });

    it('Não deve atualizar nota de outro usuário', async () => {
      noteRepository.getNoteByIdDb.mockResolvedValue(OTHERS_NOTE);

      await expect(
        updateNote({ userId: 'u1', noteId: 'n2', title: 'X' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(noteRepository.updateNoteDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteNote', () => {
    it('Deve excluir a nota própria', async () => {
      noteRepository.getNoteByIdDb.mockResolvedValue(OWN_NOTE);

      await deleteNote({ userId: 'u1', noteId: 'n1' });

      expect(noteRepository.deleteNoteDb).toHaveBeenCalledWith('n1');
    });

    it('Não deve excluir nota de outro usuário', async () => {
      noteRepository.getNoteByIdDb.mockResolvedValue(OTHERS_NOTE);

      await expect(
        deleteNote({ userId: 'u1', noteId: 'n2' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(noteRepository.deleteNoteDb).not.toHaveBeenCalled();
    });
  });

  describe('generateFlashcardsForNote (comportamento atual, refeito na Fase 6)', () => {
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
});