import { createNoteDb } from '../repositories/noteRepository.js';
import { createManyFlashcardsDb } from '../repositories/flashcardRepository.js';
import { generateFlashcardsFromText } from './aiClient.js';

const MAX_NOTE_CHARS = 6000;

/**
 * Cria uma nova nota associada a uma matéria
 */
export async function createNoteForSubject({ subjectId, title, content }) {
  if (!content) {
    throw new Error('Conteúdo da nota é obrigatório.');
  }

  if (content.length > MAX_NOTE_CHARS) {
    throw new Error(`A nota ultrapassou o limite máximo de ${MAX_NOTE_CHARS} caracteres.`);
  }

  const noteDataToSave = {
    subjectId,
    title: title || 'Nota sem título',
    content,
    createdAt: new Date().toISOString()
  };

  return await createNoteDb(noteDataToSave);
}

/**
 * Gera flashcards baseados no conteúdo de uma nota existente utilizando IA
 */
export async function generateFlashcardsForNote(subjectId, noteInput) {
  if (!noteInput || !noteInput.content) {
    throw new Error('Conteúdo da nota é obrigatório.');
  }

  if (noteInput.content.length > MAX_NOTE_CHARS) {
    throw new Error(`A nota ultrapassou o limite máximo de ${MAX_NOTE_CHARS} caracteres.`);
  }

  // Como a nota já existe no banco (passada por noteInput), usamos o noteId dela diretamente
  const targetNoteId = noteInput.noteId;

  // 1. Chama a IA para gerar os flashcards passando o título e o conteúdo
  const generatedCardsRaw = await generateFlashcardsFromText(noteInput.title, noteInput.content);

  // 2. Prepara os flashcards amarrados corretamente ao noteId real e ao subjectId
  const flashcardsToInsert = generatedCardsRaw.map(card => ({
    noteId: targetNoteId,
    subjectId,
    front: card.front,
    back: card.back,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString()
  }));

  // 3. Salva os flashcards em lote no Firestore
  const savedFlashcards = await createManyFlashcardsDb(flashcardsToInsert);

  return {
    ...noteInput,
    flashcards: savedFlashcards
  };
}