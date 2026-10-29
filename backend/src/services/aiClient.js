const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export async function generateFlashcardsFromText(
  title,
  content,
  customFetch = (...args) => globalThis.fetch(...args)
) {
  try {
    const response = await customFetch(`${AI_SERVICE_URL}/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro no ai-service (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    return data.flashcards || data;
  } catch (error) {
    console.error('Falha na comunicação com al-service:', error.message);
    throw new Error('Não foi possível gerar os flashcards via IA no momento. Tente novamente mais tarde.');
  }
}