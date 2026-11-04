import {
  createFlashcardDb,
  createManyFlashcardsDb,
  getFlashcardsByNoteDb,
  getFlashcardsBySubjectDb,
  getFlashcardByIdDb,
  updateFlashcardDb,
  deleteFlashcardDb,
  getDueFlashcardsDb
} from '../../src/repositories/flashcardRepository.js';
import { buildNewFlashcard, FLASHCARD_SOURCES } from '../../src/config/flashcards.js';
import { clearAll } from '../helpers/emulator.js';

const HOUR = 3600000;

function card(overrides = {}) {
  return {
    ...buildNewFlashcard({
      userId: 'user_1',
      subjectId: 'sub_1',
      source: FLASHCARD_SOURCES.MANUAL,
      front: 'P?',
      back: 'R.'
    }),
    ...overrides
  };
}

describe('Repositório de Flashcards - Firestore', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('Deve criar um flashcard e devolver o flashcardId', async () => {
    const result = await createFlashcardDb(card({ front: 'O que é um ponteiro em C?' }));

    expect(result).toHaveProperty('flashcardId');
    expect(result).toMatchObject({ userId: 'user_1', subjectId: 'sub_1', front: 'O que é um ponteiro em C?' });
  });

  it('Deve criar vários flashcards em lote', async () => {
    const result = await createManyFlashcardsDb([card({ front: 'a' }), card({ front: 'b' })]);

    expect(result).toHaveLength(2);
    expect(result[0].flashcardId).not.toBe(result[1].flashcardId);
  });

  it('Deve buscar flashcards pelo ID da nota', async () => {
    await createFlashcardDb(card({ noteId: 'n1', front: 'da nota' }));
    await createFlashcardDb(card({ noteId: 'n2', front: 'de outra' }));

    const cards = await getFlashcardsByNoteDb('n1');

    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('da nota');
  });

  it('Deve listar somente os flashcards da matéria informada', async () => {
    await createFlashcardDb(card({ subjectId: 'sub_1', front: 'a' }));
    await createFlashcardDb(card({ subjectId: 'sub_1', front: 'b' }));
    await createFlashcardDb(card({ subjectId: 'sub_2', front: 'c' }));

    const cards = await getFlashcardsBySubjectDb('sub_1');

    expect(cards.map((c) => c.front).sort()).toEqual(['a', 'b']);
  });

  it('Deve buscar um flashcard pelo ID e retornar null se não existir', async () => {
    const created = await createFlashcardDb(card({ back: 'endereço de memória' }));

    const found = await getFlashcardByIdDb(created.flashcardId);

    expect(found).toMatchObject({ flashcardId: created.flashcardId, back: 'endereço de memória' });
    expect(await getFlashcardByIdDb('fantasma')).toBeNull();
  });

  it('Deve atualizar os campos e retornar o card atualizado', async () => {
    const created = await createFlashcardDb(card());

    const updated = await updateFlashcardDb(created.flashcardId, { interval: 1, lapses: 1, easeFactor: 2.6 });

    expect(updated).toMatchObject({ interval: 1, lapses: 1, easeFactor: 2.6, front: 'P?' });
  });

  it('Deve falhar ao atualizar um flashcard inexistente', async () => {
    await expect(updateFlashcardDb('fantasma', { front: 'X' })).rejects.toThrow();
  });

  it('Deve excluir o flashcard e não falhar se ele não existir', async () => {
    const created = await createFlashcardDb(card());

    await deleteFlashcardDb(created.flashcardId);

    expect(await getFlashcardByIdDb(created.flashcardId)).toBeNull();
    await expect(deleteFlashcardDb('fantasma')).resolves.not.toThrow();
  });

  describe('getDueFlashcardsDb', () => {
    const now = () => new Date().toISOString();
    const past = () => new Date(Date.now() - HOUR).toISOString();
    const future = () => new Date(Date.now() + HOUR).toISOString();

    it('Deve retornar só os vencidos do usuário', async () => {
      await createFlashcardDb(card({ front: 'vencido', dueDate: past() }));
      await createFlashcardDb(card({ front: 'futuro', dueDate: future() }));
      await createFlashcardDb(card({ userId: 'user_2', front: 'de outro', dueDate: past() }));

      const due = await getDueFlashcardsDb('user_1', now());

      expect(due).toHaveLength(1);
      expect(due[0].front).toBe('vencido');
    });

    it('Deve filtrar por matéria quando subjectId é informado', async () => {
      await createFlashcardDb(card({ subjectId: 'sub_1', front: 'da 1', dueDate: past() }));
      await createFlashcardDb(card({ subjectId: 'sub_2', front: 'da 2', dueDate: past() }));

      const onlySub2 = await getDueFlashcardsDb('user_1', now(), { subjectId: 'sub_2' });
      const all = await getDueFlashcardsDb('user_1', now());

      expect(onlySub2.map((c) => c.front)).toEqual(['da 2']);
      expect(all).toHaveLength(2);
    });

    it('Deve incluir o card cujo vencimento é exatamente agora', async () => {
      const exact = now();
      await createFlashcardDb(card({ front: 'exato', dueDate: exact }));

      const due = await getDueFlashcardsDb('user_1', exact);

      expect(due).toHaveLength(1);
    });
  });
});