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
 * Gera flashcards baseados no conteúdo de uma nota utilizando IA
 */
export async function generateFlashcardsForNote(subjectId, noteInput) {
  if (!noteInput || !noteInput.content) {
    throw new Error('Conteúdo da nota é obrigatório.');
  }

  if (noteInput.content.length > MAX_NOTE_CHARS) {
    throw new Error(`A nota ultrapassou o limite máximo de ${MAX_NOTE_CHARS} caracteres.`);
  }

  // 1. Salva a nota no Firestore usando o repositório real
  const noteDataToSave = {
    subjectId,
    title: noteInput.title || 'Nota sem título',
    content: noteInput.content,
    createdAt: new Date().toISOString()
  };

  const savedNote = await createNoteDb(noteDataToSave);

  // 2. Chama a IA para gerar os flashcards passando o título e o conteúdo
  const generatedCardsRaw = await generateFlashcardsFromText(savedNote.title, savedNote.content);

  // 3. Prepara os flashcards com o ID da nota recém-criada
  const flashcardsToInsert = generatedCardsRaw.map(card => ({
    noteId: savedNote.noteId,
    subjectId,
    front: card.front,
    back: card.back,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString()
  }));

  // 4. Salva os flashcards em lote no Firestore
  const savedFlashcards = await createManyFlashcardsDb(flashcardsToInsert);

  return {
    ...savedNote,
    flashcards: savedFlashcards
  };
}