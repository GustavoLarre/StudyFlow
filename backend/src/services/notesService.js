import * as defaultAiClient from './aiClient.js';

const MAX_NOTE_LENGTH = 6000;
const MAX_CHUNKS = 3;

function chunkText(text, maxChunks = MAX_CHUNKS) {
  if (text.length <= 2000) return [text];

  const chunkSize = Math.ceil(text.length / maxChunks);
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
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

  // Opcional: Podemos incluir o título no contexto enviado à IA se desejado, 
  // mas fatiamos principalmente o content para gerar os cartões.
  const textChunks = chunkText(noteObject.content);
  let allGeneratedFlashcards = [];

  for (const chunk of textChunks) {
    // Se quiser dar contexto para a IA, pode enviar "Título: [title]\n\nConteúdo: [chunk]"
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