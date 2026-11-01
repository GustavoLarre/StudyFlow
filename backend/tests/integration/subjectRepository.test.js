import {
  createSubjectDb,
  getSubjectsByUserDb,
  getSubjectByIdDb,
  updateSubjectDb,
  deleteSubjectCascadeDb
} from '../../src/repositories/subjectRepository.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';

describe('Repositório de Matérias - exclusão em cascata', () => {
  beforeEach(async () => {
    await clearAll();
  });

  async function seed(subjectId, { notes, flashcards }) {
    const batch = db.batch();
    for (let i = 0; i < notes; i++) {
      batch.set(db.collection('notes').doc(), { subjectId, title: `n${i}` });
    }
    for (let i = 0; i < flashcards; i++) {
      batch.set(db.collection('flashcards').doc(), { subjectId, front: `f${i}` });
    }
    await batch.commit();
  }

  it('Deve apagar a matéria, suas notas e seus flashcards', async () => {
    const subject = await createSubjectDb({ userId: 'user_1', title: 'A' });
    await seed(subject.subjectId, { notes: 2, flashcards: 3 });

    const result = await deleteSubjectCascadeDb(subject.subjectId);

    expect(result).toEqual({ notes: 2, flashcards: 3 });
    expect(await getSubjectByIdDb(subject.subjectId)).toBeNull();
    expect((await db.collection('notes').get()).size).toBe(0);
    expect((await db.collection('flashcards').get()).size).toBe(0);
  });

  it('Não deve tocar em dados de outras matérias', async () => {
    const a = await createSubjectDb({ userId: 'user_1', title: 'A' });
    const b = await createSubjectDb({ userId: 'user_1', title: 'B' });
    await seed(a.subjectId, { notes: 2, flashcards: 2 });
    await seed(b.subjectId, { notes: 3, flashcards: 4 });

    await deleteSubjectCascadeDb(a.subjectId);

    expect(await getSubjectByIdDb(b.subjectId)).not.toBeNull();
    expect((await db.collection('notes').where('subjectId', '==', b.subjectId).get()).size).toBe(3);
    expect((await db.collection('flashcards').where('subjectId', '==', b.subjectId).get()).size).toBe(4);
  });

  it('Deve paginar em vários lotes quando há mais documentos que o tamanho do lote', async () => {
    const subject = await createSubjectDb({ userId: 'user_1', title: 'A' });
    await seed(subject.subjectId, { notes: 7, flashcards: 5 });

    const result = await deleteSubjectCascadeDb(subject.subjectId, { batchSize: 3 });

    expect(result).toEqual({ notes: 7, flashcards: 5 });
    expect((await db.collection('notes').get()).size).toBe(0);
    expect((await db.collection('flashcards').get()).size).toBe(0);
  });

  it('Deve apagar mais de 500 documentos usando o limite real do Firestore', async () => {
    const subject = await createSubjectDb({ userId: 'user_1', title: 'Grande' });
    await seed(subject.subjectId, { notes: 0, flashcards: 0 });

    for (let start = 0; start < 1100; start += 400) {
      const batch = db.batch();
      for (let i = start; i < Math.min(start + 400, 1100); i++) {
        batch.set(db.collection('flashcards').doc(), { subjectId: subject.subjectId, front: `f${i}` });
      }
      await batch.commit();
    }

    const result = await deleteSubjectCascadeDb(subject.subjectId);

    expect(result.flashcards).toBe(1100);
    expect((await db.collection('flashcards').get()).size).toBe(0);
  }, 30000);

  it('Não deve falhar para uma matéria inexistente (retorna zeros)', async () => {
    const result = await deleteSubjectCascadeDb('fantasma');

    expect(result).toEqual({ notes: 0, flashcards: 0 });
  });
});