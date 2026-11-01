import {
  createNoteDb,
  getNotesBySubjectDb,
  getNoteByIdDb,
  updateNoteDb,
  deleteNoteDb
} from '../../src/repositories/noteRepository.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';

describe('Repositório de Notas - Firestore', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('Deve criar uma nota com userId e subjectId', async () => {
    const result = await createNoteDb({
      userId: 'user_1',
      subjectId: 'sub_1',
      title: 'Estruturas de Dados Básicas',
      content: 'Ponteiros, listas encadeadas e alocação dinâmica.',
      createdAt: new Date().toISOString()
    });

    expect(result).toHaveProperty('noteId');
    expect(result).toMatchObject({ userId: 'user_1', subjectId: 'sub_1' });
  });

  it('Deve listar somente as notas da matéria informada', async () => {
    await createNoteDb({ userId: 'user_1', subjectId: 'sub_1', title: 'A', content: 'a' });
    await createNoteDb({ userId: 'user_1', subjectId: 'sub_1', title: 'B', content: 'b' });
    await createNoteDb({ userId: 'user_1', subjectId: 'sub_2', title: 'C', content: 'c' });

    const notes = await getNotesBySubjectDb('sub_1');

    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.title).sort()).toEqual(['A', 'B']);
  });

  it('Deve buscar uma nota pelo ID', async () => {
    const created = await createNoteDb({ userId: 'user_1', subjectId: 'sub_1', title: 'T', content: 'c' });

    const note = await getNoteByIdDb(created.noteId);

    expect(note).toMatchObject({ noteId: created.noteId, title: 'T' });
  });

  it('Deve retornar null ao buscar uma nota com ID inexistente', async () => {
    expect(await getNoteByIdDb('id_que_nao_existe')).toBeNull();
  });

  it('Deve atualizar a nota e retornar o resultado', async () => {
    const created = await createNoteDb({ userId: 'user_1', subjectId: 'sub_1', title: 'Antigo', content: 'c' });

    const updated = await updateNoteDb(created.noteId, { title: 'Novo', content: 'novo conteúdo' });

    expect(updated).toMatchObject({
      noteId: created.noteId,
      userId: 'user_1',
      title: 'Novo',
      content: 'novo conteúdo'
    });
  });

  it('Deve falhar ao atualizar uma nota inexistente', async () => {
    await expect(updateNoteDb('fantasma', { title: 'X' })).rejects.toThrow();
  });

  it('Deve excluir a nota sem apagar os flashcards gerados a partir dela', async () => {
    const created = await createNoteDb({ userId: 'user_1', subjectId: 'sub_1', title: 'T', content: 'c' });
    await db.collection('flashcards').add({ noteId: created.noteId, subjectId: 'sub_1', front: 'f' });

    await deleteNoteDb(created.noteId);

    expect(await getNoteByIdDb(created.noteId)).toBeNull();
    expect((await db.collection('flashcards').get()).size).toBe(1);
  });

  it('Não deve falhar ao excluir uma nota inexistente', async () => {
    await expect(deleteNoteDb('fantasma')).resolves.not.toThrow();
  });
});