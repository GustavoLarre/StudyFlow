import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  getUserByUidDb: jest.fn()
}));
jest.unstable_mockModule('../../src/repositories/subjectRepository.js', () => ({
  getSubjectsByUserDb: jest.fn()
}));
jest.unstable_mockModule('../../src/repositories/flashcardRepository.js', () => ({
  getFlashcardsByUserDb: jest.fn()
}));

const userRepo = await import('../../src/repositories/userRepository.js');
const subjectRepo = await import('../../src/repositories/subjectRepository.js');
const cardRepo = await import('../../src/repositories/flashcardRepository.js');
const { getProgress } = await import('../../src/services/progressService.js');

// Por padrão o card já foi revisado (state 'review')
const card = (subjectId, rating, state = 'review') => ({ subjectId, rating, state });

describe('Unidade - progressService.getProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userRepo.getUserByUidDb.mockResolvedValue({ uid: 'u1', xp: 120, level: 2 });
    subjectRepo.getSubjectsByUserDb.mockResolvedValue([]);
    cardRepo.getFlashcardsByUserDb.mockResolvedValue([]);
  });

  it('Devolve XP total, nível e progresso dentro do nível', async () => {
    const result = await getProgress('u1');

    expect(result.xp).toEqual({ total: 120, level: 2, currentLevelXp: 20, nextLevelXp: 200 });
  });

  it('Agrega os cards de cada matéria nas categorias', async () => {
    subjectRepo.getSubjectsByUserDb.mockResolvedValue([
      { subjectId: 's1', title: 'Redes' },
      { subjectId: 's2', title: 'BD' }
    ]);
    cardRepo.getFlashcardsByUserDb.mockResolvedValue([
      card('s1', 4), card('s1', 4), card('s1', 3), card('s1', 2), card('s1', 1),
      card('s2', 1)
    ]);

    const result = await getProgress('u1');

    expect(result.subjects).toEqual([
      { subjectId: 's1', title: 'Redes', total: 5, stats: { novo: 0, muitoFacil: 2, facil: 1, medio: 1, dificil: 1 } },
      { subjectId: 's2', title: 'BD', total: 1, stats: { novo: 0, muitoFacil: 0, facil: 0, medio: 0, dificil: 1 } }
    ]);
  });

  it('Inclui matérias sem cards com tudo zerado', async () => {
    subjectRepo.getSubjectsByUserDb.mockResolvedValue([{ subjectId: 's1', title: 'Vazia' }]);

    const result = await getProgress('u1');

    expect(result.subjects).toEqual([
      { subjectId: 's1', title: 'Vazia', total: 0, stats: { novo: 0, muitoFacil: 0, facil: 0, medio: 0, dificil: 0 } }
    ]);
  });

  it('Card novo (nunca revisado) conta como novo, não como difícil', async () => {
    subjectRepo.getSubjectsByUserDb.mockResolvedValue([{ subjectId: 's1', title: 'A' }]);
    cardRepo.getFlashcardsByUserDb.mockResolvedValue([
      card('s1', null, 'new'),
      card('s1', 1, 'new'), // rating legado em card nunca revisado
      card('s1', 1, 'learning')
    ]);

    const result = await getProgress('u1');

    expect(result.subjects[0].stats).toEqual({ novo: 2, muitoFacil: 0, facil: 0, medio: 0, dificil: 1 });
    expect(result.subjects[0].total).toBe(3);
  });

  it('Rating ausente ou inválido em card já revisado conta como novo', async () => {
    subjectRepo.getSubjectsByUserDb.mockResolvedValue([{ subjectId: 's1', title: 'A' }]);
    cardRepo.getFlashcardsByUserDb.mockResolvedValue([card('s1', undefined), card('s1', 9)]);

    const result = await getProgress('u1');

    expect(result.subjects[0].stats.novo).toBe(2);
    expect(result.subjects[0].stats.dificil).toBe(0);
  });

  it('Ignora cards de matérias inexistentes e consulta só pelo usuário', async () => {
    subjectRepo.getSubjectsByUserDb.mockResolvedValue([{ subjectId: 's1', title: 'A' }]);
    cardRepo.getFlashcardsByUserDb.mockResolvedValue([card('fantasma', 4)]);

    const result = await getProgress('u1');

    expect(result.subjects[0].total).toBe(0);
    expect(subjectRepo.getSubjectsByUserDb).toHaveBeenCalledWith('u1');
    expect(cardRepo.getFlashcardsByUserDb).toHaveBeenCalledWith('u1');
  });
});