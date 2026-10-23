import * as defaultAiClient from './aiClient.js';

const MAX_NOTE_LENGTH = 6000;
const MAX_CHUNKS = 3;
const notesDb = [];

function chunkText(text, maxChunks = MAX_CHUNKS) {
  if (text.length <= 2000) return [text];

  const chunkSize = Math.ceil(text.length / maxChunks);
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

export async function createNoteForSubject({ subjectId, title, content }) {
  if (!subjectId) {
    throw new Error('O ID da matéria é obrigatório para criar uma nota.');
  }

  if (!title || title.trim() === '') {
    throw new Error('O título da nota é obrigatório.');
  }

  if (!content) {
    throw new Error('O conteúdo da nota é obrigatório.');
  }

  // Validação dos 6.000 caracteres
  if (content.length > MAX_NOTE_LENGTH) {
    throw new Error('A nota excede o limite máximo de 6000 caracteres.');
  }

  const newNote = {
    noteId: `note_${Date.now()}`,
    subjectId,
    title: title.trim(),
    content,
    createdAt: new Date().toISOString()
  };

  notesDb.push(newNote);
  return newNote;
}

export async function getNotesBySubject(subjectId) {
  if (!subjectId) {
    throw new Error('O ID da matéria é obrigatório.');
  }

  return notesDb.filter(note => note.subjectId === subjectId);
}

/**
 * Orquestra a conversão de uma nota em flashcards via IA.
 * A nota original { title, content } permanece estritamente imutável.
 */
export async function generateFlashcardsForNote(noteId, noteObject, aiClient = defaultAiClient) {
  if (!noteObject || !noteObject.content) {
    throw new Error('O conteúdo da nota não pode estar vazio.');
  }

  if (noteObject.content.length > MAX_NOTE_LENGTH) {
    throw new Error(`A nota ultrapassa o limite máximo de ${MAX_NOTE_LENGTH} caracteres.`);
  }

  const textChunks = chunkText(noteObject.content);
  let allGeneratedFlashcards = [];

  for (const chunk of textChunks) {
    const promptPayload = `Título: ${noteObject.title || 'Sem Título'}\n\n${chunk}`;
    
    const flashcardsFromAi = await aiClient.generateFlashcardsFromText(promptPayload);
    
    if (Array.isArray(flashcardsFromAi)) {
      allGeneratedFlashcards = allGeneratedFlashcards.concat(flashcardsFromAi);
    }
  }

  // Mapeia os flashcards vinculando ao noteId de origem
  const flashcardsToPersist = allGeneratedFlashcards.map((card) => ({
    noteId,
    front: card.front,
    back: card.back,
    createdAt: new Date().toISOString()
  }));

  return flashcardsToPersist;
}