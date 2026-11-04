import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/flashcardRepository.js', () => ({
  createFlashcardDb: jest.fn(),
  getFlashcardsBySubjectDb: jest.fn(),
  getFlashcardByIdDb: jest.fn(),
  updateFlashcardDb: jest.fn(),
  deleteFlashcardDb: jest.fn()
}));
jest.unstable_mockModule('../../src/repositories/subjectRepository.js', () => ({
  getSubjectByIdDb: jest.fn()
}));
jest.unstable_mockModule('../../src/repositories/noteRepository.js', () => ({
  getNoteByIdDb: jest.fn()
}));
jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  getUserByUidDb: jest.fn(),
  updateUserDb: jest.fn()
}));

const cardRepo = await import('../../src/repositories/flashcardRepository.js');
const subjectRepo = await import('../../src/repositories/subjectRepository.js');
const noteRepo = await import('../../src/repositories/noteRepository.js');
const userRepo = await import('../../src/repositories/userRepository.js');
const {
  createFlashcard, listFlashcards, getFlashcard, updateFlashcard, deleteFlashcard, MAX_CARD_TEXT
} = await import('../../src/services/flashcardService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

const SUBJECT = { subjectId: 's1', userId: 'u1' };
const OTHER_SUBJECT = { subjectId: 's2', userId: 'u2' };
const NOTE = { noteId: 'n1', userId: 'u1', subjectId: 's1' };
const CARD = { flashcardId: 'c1', userId: 'u1', subjectId: 's1', front: 'P', back: 'R' };
const OTHER_CARD = { flashcardId: 'c2', userId: 'u2', subjectId: 's2', front: 'P', back: 'R' };

describe('Unidade - flashcardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cardRepo.createFlashcardDb.mockImplementation(async (d) => ({ flashcardId: 'c1', ...d }));
    userRepo.getUserByUidDb.mockResolvedValue({ uid: 'u1', xp: 0, level: 1 });
    userRepo.updateUserDb.mockImplementation(async (uid, d) => ({ uid, ...d }));
  });

  describe('createFlashcard', () => {
    it('Deve criar card manual com defaults, texto aparado e +1 XP', async () => {
      subjectRepo.getSubjectByIdDb.mockResolvedValue(SUBJECT);

      const result = await createFlashcard({ userId: 'u1', subjectId: 's1', front: ' P? ', back: ' R. ' });

      expect(cardRepo.createFlashcardDb).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1', subjectId: 's1', noteId: null, source: 'manual',
          front: 'P?', back: 'R.', rating: 1, state: 'new'
        })
      );
      expect(userRepo.updateUserDb).toHaveBeenCalledWith('u1', { xp: 1, level: 1 });
      expect(result.flashcard).toMatchObject({ flashcardId: 'c1', front: 'P?' });
      expect(result.gamification).toMatchObject({ gainedXp: 1, totalXp: 1, level: 1 });
    });

    it.each([[undefined], [''], ['  '], [5]])('Deve rejeitar front inválido (%p)', async (front) => {
      await expect(
        createFlashcard({ userId: 'u1', subjectId: 's1', front, back: 'R' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(cardRepo.createFlashcardDb).not.toHaveBeenCalled();
    });

    it('Deve rejeitar back vazio e texto acima do limite', async () => {
      await expect(
        createFlashcard({ userId: 'u1', subjectId: 's1', front: 'P', back: '' })
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        createFlashcard({ userId: 'u1', subjectId: 's1', front: 'a'.repeat(MAX_CARD_TEXT + 1), back: 'R' })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('Deve lançar NotFoundError para matéria de outro usuário', async () => {
      subjectRepo.getSubjectByIdDb.mockResolvedValue(OTHER_SUBJECT);

      await expect(
        createFlashcard({ userId: 'u1', subjectId: 's2', front: 'P', back: 'R' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(cardRepo.createFlashcardDb).not.toHaveBeenCalled();
    });

    it('Deve guardar o noteId quando a nota é do usuário e da mesma matéria', async () => {
      subjectRepo.getSubjectByIdDb.mockResolvedValue(SUBJECT);
      noteRepo.getNoteByIdDb.mockResolvedValue(NOTE);

      await createFlashcard({ userId: 'u1', subjectId: 's1', noteId: 'n1', front: 'P', back: 'R' });

      expect(cardRepo.createFlashcardDb).toHaveBeenCalledWith(expect.objectContaining({ noteId: 'n1' }));
    });

    it('Deve rejeitar nota de outro usuário ou de outra matéria (404)', async () => {
      subjectRepo.getSubjectByIdDb.mockResolvedValue(SUBJECT);

      noteRepo.getNoteByIdDb.mockResolvedValueOnce({ ...NOTE, userId: 'u2' });
      await expect(
        createFlashcard({ userId: 'u1', subjectId: 's1', noteId: 'n1', front: 'P', back: 'R' })
      ).rejects.toBeInstanceOf(NotFoundError);

      noteRepo.getNoteByIdDb.mockResolvedValueOnce({ ...NOTE, subjectId: 'outra' });
      await expect(
        createFlashcard({ userId: 'u1', subjectId: 's1', noteId: 'n1', front: 'P', back: 'R' })
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(cardRepo.createFlashcardDb).not.toHaveBeenCalled();
    });

    it('Não deve desfazer a criação se a gravação do XP falhar', async () => {
      subjectRepo.getSubjectByIdDb.mockResolvedValue(SUBJECT);
      userRepo.updateUserDb.mockRejectedValue(new Error('falha xp'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createFlashcard({ userId: 'u1', subjectId: 's1', front: 'P', back: 'R' });

      expect(result.flashcard).toBeDefined();
      expect(result.gamification).toBeNull();
      spy.mockRestore();
    });
  });

  describe('listFlashcards', () => {
    it('Deve listar os cards de uma matéria do usuário', async () => {
      subjectRepo.getSubjectByIdDb.mockResolvedValue(SUBJECT);
      cardRepo.getFlashcardsBySubjectDb.mockResolvedValue([CARD]);

      expect(await listFlashcards({ userId: 'u1', subjectId: 's1' })).toEqual([CARD]);
    });

    it('Não deve listar de matéria de outro usuário', async () => {
      subjectRepo.getSubjectByIdDb.mockResolvedValue(OTHER_SUBJECT);

      await expect(
        listFlashcards({ userId: 'u1', subjectId: 's2' })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getFlashcard', () => {
    it('Deve retornar o card próprio e 404 para inexistente ou alheio', async () => {
      cardRepo.getFlashcardByIdDb.mockResolvedValueOnce(CARD);
      expect(await getFlashcard({ userId: 'u1', flashcardId: 'c1' })).toEqual(CARD);

      cardRepo.getFlashcardByIdDb.mockResolvedValueOnce(null);
      await expect(getFlashcard({ userId: 'u1', flashcardId: 'x' })).rejects.toBeInstanceOf(NotFoundError);

      cardRepo.getFlashcardByIdDb.mockResolvedValueOnce(OTHER_CARD);
      await expect(getFlashcard({ userId: 'u1', flashcardId: 'c2' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateFlashcard', () => {
    it('Deve atualizar só front/back e renovar updatedAt', async () => {
      cardRepo.getFlashcardByIdDb.mockResolvedValue(CARD);
      cardRepo.updateFlashcardDb.mockImplementation(async (id, d) => ({ ...CARD, ...d }));

      const result = await updateFlashcard({ userId: 'u1', flashcardId: 'c1', front: ' Novo ' });

      const [, data] = cardRepo.updateFlashcardDb.mock.calls[0];
      expect(data).toEqual({ front: 'Novo', updatedAt: expect.any(String) });
      expect(result.front).toBe('Novo');
    });

    it('Deve ignorar campos de repetição espaçada enviados', async () => {
      cardRepo.getFlashcardByIdDb.mockResolvedValue(CARD);
      cardRepo.updateFlashcardDb.mockImplementation(async (id, d) => ({ ...CARD, ...d }));

      await updateFlashcard({ userId: 'u1', flashcardId: 'c1', back: 'B', interval: 99, rating: 4 });

      const [, data] = cardRepo.updateFlashcardDb.mock.calls[0];
      expect(data).not.toHaveProperty('interval');
      expect(data).not.toHaveProperty('rating');
    });

    it('Deve exigir front ou back e validar o conteúdo', async () => {
      await expect(
        updateFlashcard({ userId: 'u1', flashcardId: 'c1' })
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        updateFlashcard({ userId: 'u1', flashcardId: 'c1', front: ' ' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(cardRepo.updateFlashcardDb).not.toHaveBeenCalled();
    });

    it('Não deve atualizar card de outro usuário', async () => {
      cardRepo.getFlashcardByIdDb.mockResolvedValue(OTHER_CARD);

      await expect(
        updateFlashcard({ userId: 'u1', flashcardId: 'c2', front: 'X' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(cardRepo.updateFlashcardDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteFlashcard', () => {
    it('Deve excluir o card próprio e recusar o alheio', async () => {
      cardRepo.getFlashcardByIdDb.mockResolvedValueOnce(CARD);
      await deleteFlashcard({ userId: 'u1', flashcardId: 'c1' });
      expect(cardRepo.deleteFlashcardDb).toHaveBeenCalledWith('c1');

      cardRepo.getFlashcardByIdDb.mockResolvedValueOnce(OTHER_CARD);
      await expect(
        deleteFlashcard({ userId: 'u1', flashcardId: 'c2' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(cardRepo.deleteFlashcardDb).toHaveBeenCalledTimes(1);
    });
  });
});