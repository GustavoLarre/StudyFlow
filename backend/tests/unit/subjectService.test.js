import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/subjectRepository.js', () => ({
  createSubjectDb: jest.fn(),
  getSubjectsByUserDb: jest.fn(),
  getSubjectByIdDb: jest.fn(),
  updateSubjectDb: jest.fn(),
  deleteSubjectCascadeDb: jest.fn()
}));

const subjectRepository = await import('../../src/repositories/subjectRepository.js');
const {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject
} = await import('../../src/services/subjectService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

const OWN = { subjectId: 's1', userId: 'u1', title: 'Minha' };
const OTHERS = { subjectId: 's2', userId: 'u2', title: 'De outro' };

describe('Unidade - subjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubject', () => {
    it('Deve criar com userId, título aparado e datas', async () => {
      subjectRepository.createSubjectDb.mockImplementation(async (d) => ({ subjectId: 's1', ...d }));

      const result = await createSubject({ userId: 'u1', title: '  Grafos  ' });

      expect(subjectRepository.createSubjectDb).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', title: 'Grafos' })
      );
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
    });

    it.each([[undefined], [''], ['   '], [123]])('Deve rejeitar título inválido (%p)', async (title) => {
      await expect(createSubject({ userId: 'u1', title })).rejects.toBeInstanceOf(ValidationError);
      expect(subjectRepository.createSubjectDb).not.toHaveBeenCalled();
    });

    it('Deve rejeitar título com mais de 100 caracteres', async () => {
      await expect(
        createSubject({ userId: 'u1', title: 'a'.repeat(101) })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('getAllSubjects', () => {
    it('Deve listar só as matérias do usuário', async () => {
      subjectRepository.getSubjectsByUserDb.mockResolvedValue([OWN]);

      const result = await getAllSubjects('u1');

      expect(subjectRepository.getSubjectsByUserDb).toHaveBeenCalledWith('u1');
      expect(result).toEqual([OWN]);
    });
  });

  describe('getSubject', () => {
    it('Deve retornar a matéria própria', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OWN);

      expect(await getSubject({ userId: 'u1', subjectId: 's1' })).toEqual(OWN);
    });

    it('Deve lançar NotFoundError para matéria inexistente', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(null);

      await expect(getSubject({ userId: 'u1', subjectId: 'x' })).rejects.toBeInstanceOf(NotFoundError);
    });

    it('Deve lançar NotFoundError (e não 403) para matéria de outro usuário', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OTHERS);

      await expect(getSubject({ userId: 'u1', subjectId: 's2' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateSubject', () => {
    it('Deve atualizar o título aparado e o updatedAt', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OWN);
      subjectRepository.updateSubjectDb.mockImplementation(async (id, d) => ({ ...OWN, ...d }));

      const result = await updateSubject({ userId: 'u1', subjectId: 's1', title: '  Novo ' });

      expect(subjectRepository.updateSubjectDb).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ title: 'Novo', updatedAt: expect.any(String) })
      );
      expect(result.title).toBe('Novo');
    });

    it('Deve rejeitar título inválido sem tocar no banco', async () => {
      await expect(
        updateSubject({ userId: 'u1', subjectId: 's1', title: ' ' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(subjectRepository.updateSubjectDb).not.toHaveBeenCalled();
    });

    it('Não deve atualizar matéria de outro usuário', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OTHERS);

      await expect(
        updateSubject({ userId: 'u1', subjectId: 's2', title: 'X' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(subjectRepository.updateSubjectDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteSubject', () => {
    it('Deve excluir em cascata a matéria própria', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OWN);
      subjectRepository.deleteSubjectCascadeDb.mockResolvedValue({ notes: 1, flashcards: 2 });

      const result = await deleteSubject({ userId: 'u1', subjectId: 's1' });

      expect(subjectRepository.deleteSubjectCascadeDb).toHaveBeenCalledWith('s1');
      expect(result).toEqual({ notes: 1, flashcards: 2 });
    });

    it('Não deve excluir matéria de outro usuário', async () => {
      subjectRepository.getSubjectByIdDb.mockResolvedValue(OTHERS);

      await expect(
        deleteSubject({ userId: 'u1', subjectId: 's2' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(subjectRepository.deleteSubjectCascadeDb).not.toHaveBeenCalled();
    });
  });
});