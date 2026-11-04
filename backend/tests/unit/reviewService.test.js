import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/flashcardRepository.js', () => ({
  getFlashcardByIdDb: jest.fn(),
  updateFlashcardDb: jest.fn(),
  getDueFlashcardsDb: jest.fn()
}));

jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  getUserByUidDb: jest.fn(),
  updateUserDb: jest.fn()
}));

jest.unstable_mockModule('../../src/repositories/subjectRepository.js', () => ({
  getSubjectByIdDb: jest.fn()
}));

const cardRepo = await import('../../src/repositories/flashcardRepository.js');
const userRepo = await import('../../src/repositories/userRepository.js');
const subjectRepo = await import('../../src/repositories/subjectRepository.js');
const { reviewFlashcard, getDueFlashcards, REVIEW_BATCH_LIMIT } = await import('../../src/services/reviewService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

const NOW = new Date('2026-01-01T12:00:00.000Z');
const CARD = {
  flashcardId: 'c1', userId: 'u1', subjectId: 's1',
  state: 'new', step: 0, interval: 0, easeFactor: 2.5, lapses: 0, rating: 1,
  dueDate: '2026-01-01T00:00:00.000Z'
};

describe('Unidade - reviewService.reviewFlashcard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cardRepo.getFlashcardByIdDb.mockResolvedValue(CARD);
    cardRepo.updateFlashcardDb.mockImplementation(async (id, d) => ({ ...CARD, ...d }));
    userRepo.getUserByUidDb.mockResolvedValue({ uid: 'u1', xp: 0, level: 1 });
    userRepo.updateUserDb.mockResolvedValue({});
  });

  it.each([[undefined], [''], ['perfect'], [3]])('Rejeita ação inválida (%p) sem tocar no banco', async (action) => {
    await expect(
      reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action, now: NOW })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(cardRepo.getFlashcardByIdDb).not.toHaveBeenCalled();
  });

  it('404 para card inexistente ou de outro usuário', async () => {
    cardRepo.getFlashcardByIdDb.mockResolvedValueOnce(null);
    await expect(
      reviewFlashcard({ userId: 'u1', flashcardId: 'x', action: 'good', now: NOW })
    ).rejects.toBeInstanceOf(NotFoundError);

    cardRepo.getFlashcardByIdDb.mockResolvedValueOnce({ ...CARD, userId: 'u2' });
    await expect(
      reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action: 'good', now: NOW })
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(cardRepo.updateFlashcardDb).not.toHaveBeenCalled();
  });

  it('Grava o resultado do scheduler e o rating', async () => {
    const result = await reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action: 'good', now: NOW });

    expect(cardRepo.updateFlashcardDb).toHaveBeenCalledWith('c1', {
      state: 'learning', step: 1, interval: 0, easeFactor: 2.5, lapses: 0,
      dueDate: new Date(NOW.getTime() + 10 * 60000).toISOString(),
      rating: 3,
      updatedAt: NOW.toISOString()
    });
    expect(result.flashcard).toMatchObject({ state: 'learning', rating: 3 });
  });

  it.each([['again', 1], ['hard', 2], ['good', 3], ['easy', 4]])('Ação %s grava rating %i', async (action, rating) => {
    await reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action, now: NOW });

    expect(cardRepo.updateFlashcardDb.mock.calls[0][1].rating).toBe(rating);
  });

  it('Dá XP da tabela quando o card estava vencido', async () => {
    const result = await reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action: 'easy', now: NOW });

    expect(userRepo.updateUserDb).toHaveBeenCalledWith('u1', { xp: 4, level: 1 });
    expect(result.gamification).toMatchObject({ gainedXp: 4, totalXp: 4, level: 1 });
  });

  it('Dá XP quando o vencimento é exatamente agora', async () => {
    cardRepo.getFlashcardByIdDb.mockResolvedValue({ ...CARD, dueDate: NOW.toISOString() });

    const result = await reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action: 'good', now: NOW });

    expect(result.gamification.gainedXp).toBe(3);
  });

  it('Não dá XP se o card ainda não venceu, mas grava a revisão', async () => {
    cardRepo.getFlashcardByIdDb.mockResolvedValue({ ...CARD, dueDate: '2026-01-02T00:00:00.000Z' });

    const result = await reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action: 'easy', now: NOW });

    expect(cardRepo.updateFlashcardDb).toHaveBeenCalled();
    expect(userRepo.updateUserDb).not.toHaveBeenCalled();
    expect(result.gamification).toMatchObject({ gainedXp: 0, totalXp: 0, level: 1 });
  });

  it('Sobe de nível quando o XP cruza o limite', async () => {
    userRepo.getUserByUidDb.mockResolvedValue({ uid: 'u1', xp: 98, level: 1 });

    const result = await reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action: 'easy', now: NOW });

    expect(result.gamification).toMatchObject({ totalXp: 102, level: 2, leveledUp: true });
  });

  it('Não desfaz a revisão se a gravação do XP falhar', async () => {
    userRepo.updateUserDb.mockRejectedValue(new Error('xp'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await reviewFlashcard({ userId: 'u1', flashcardId: 'c1', action: 'good', now: NOW });

    expect(result.flashcard).toBeDefined();
    expect(result.gamification).toBeNull();
    spy.mockRestore();
  });
});

// NOVO (7B.3)
describe('Unidade - reviewService.getDueFlashcards', () => {
  const card = (id, dueDate, subjectId = 's1') => ({ flashcardId: id, userId: 'u1', subjectId, dueDate });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Sem subjectId, busca todas as matérias e ordena do mais atrasado ao mais recente', async () => {
    cardRepo.getDueFlashcardsDb.mockResolvedValue([
      card('b', '2026-01-01T10:00:00.000Z'),
      card('a', '2026-01-01T08:00:00.000Z', 's2')
    ]);

    const result = await getDueFlashcards({ userId: 'u1', now: NOW });

    expect(cardRepo.getDueFlashcardsDb).toHaveBeenCalledWith('u1', NOW.toISOString(), {});
    expect(result.flashcards.map((c) => c.flashcardId)).toEqual(['a', 'b']);
    expect(result.total).toBe(2);
    expect(subjectRepo.getSubjectByIdDb).not.toHaveBeenCalled();
  });

  it('Com subjectId, confere a posse da matéria e filtra', async () => {
    subjectRepo.getSubjectByIdDb.mockResolvedValue({ subjectId: 's1', userId: 'u1' });
    cardRepo.getDueFlashcardsDb.mockResolvedValue([card('a', '2026-01-01T08:00:00.000Z')]);

    await getDueFlashcards({ userId: 'u1', subjectId: 's1', now: NOW });

    expect(cardRepo.getDueFlashcardsDb).toHaveBeenCalledWith('u1', NOW.toISOString(), { subjectId: 's1' });
  });

  it('Matéria inexistente ou de outro usuário responde 404', async () => {
    subjectRepo.getSubjectByIdDb.mockResolvedValueOnce(null);
    await expect(getDueFlashcards({ userId: 'u1', subjectId: 'x', now: NOW }))
      .rejects.toBeInstanceOf(NotFoundError);

    subjectRepo.getSubjectByIdDb.mockResolvedValueOnce({ subjectId: 's2', userId: 'u2' });
    await expect(getDueFlashcards({ userId: 'u1', subjectId: 's2', now: NOW }))
      .rejects.toBeInstanceOf(NotFoundError);

    expect(cardRepo.getDueFlashcardsDb).not.toHaveBeenCalled();
  });

  it('Limita a quantidade devolvida, mantendo os mais atrasados', async () => {
    const many = Array.from({ length: REVIEW_BATCH_LIMIT + 20 }, (_, i) =>
      card(`c${i}`, new Date(Date.UTC(2025, 0, 1, 0, i)).toISOString()));
    cardRepo.getDueFlashcardsDb.mockResolvedValue(many);

    const result = await getDueFlashcards({ userId: 'u1', now: NOW });

    expect(result.flashcards).toHaveLength(REVIEW_BATCH_LIMIT);
    expect(result.flashcards[0].flashcardId).toBe('c0');
  });

  it('Sem cards vencidos devolve lista vazia', async () => {
    cardRepo.getDueFlashcardsDb.mockResolvedValue([]);

    expect(await getDueFlashcards({ userId: 'u1', now: NOW })).toEqual({ flashcards: [], total: 0 });
  });
});