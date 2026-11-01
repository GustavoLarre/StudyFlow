import { createNoteDb, getNotesBySubjectDb, getNoteByIdDb } from '../../src/repositories/noteRepository.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';

describe('Repositório de Notas - Firestore', () => {
  const mockSubjectId = `sub_test_${Date.now()}`;
  let createdNoteId;

  beforeAll(async () => {
    await clearAll();
  });

  it('Deve criar uma nota no Firestore com sucesso', async () => {
    const noteData = {
      subjectId: mockSubjectId,
      title: 'Estruturas de Dados Básicas',
      content: 'Ponteiros, listas encadeadas e alocação dinâmica.',
      createdAt: new Date().toISOString()
    };

    const result = await createNoteDb(noteData);

    expect(result).toHaveProperty('noteId');
    expect(result.title).toBe(noteData.title);
    expect(result.subjectId).toBe(mockSubjectId);

    createdNoteId = result.noteId;
  });

  it('Deve buscar notas por ID da matéria', async () => {
    const notes = await getNotesBySubjectDb(mockSubjectId);

    expect(Array.isArray(notes)).toBe(true);
    expect(notes).toHaveLength(1);

    const foundNote = notes.find(n => n.noteId === createdNoteId);
    expect(foundNote).toBeDefined();
    expect(foundNote.subjectId).toBe(mockSubjectId);
  });

  it('Deve buscar uma nota específica pelo ID', async () => {
    const note = await getNoteByIdDb(createdNoteId);

    expect(note).not.toBeNull();
    expect(note).toHaveProperty('noteId', createdNoteId);
    expect(note.title).toBe('Estruturas de Dados Básicas');
  });

  it('Deve retornar null ao buscar uma nota com ID inexistente', async () => {
    const note = await getNoteByIdDb('id_que_nao_existe');
    expect(note).toBeNull();
  });

  // NOVO: prova que o banco estava limpo (Red por repetição)
  it('Deve ter apenas as notas criadas neste arquivo de teste', async () => {
    const snapshot = await db.collection('notes').get();

    expect(snapshot.size).toBe(1);
  });
});