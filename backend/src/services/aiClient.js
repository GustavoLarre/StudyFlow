import fetch from 'node-fetch'; // Caso utilize Node abaixo da v18, ou use o fetch nativo do Node 18+

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

// Alteramos para receber um objeto contendo title e content (ou a nota inteira)
export async function generateFlashcardsFromText(title, content) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Enviamos ambos exigidos pelo Pydantic do Python
      body: JSON.stringify({ title, content })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro no ai-service (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    
    return data.flashcards || data;
  } catch (error) {
    console.error('Falha na comunicação com o ai-service:', error.message);
    throw new Error('Não foi possível gerar os flashcards via IA no momento. Tente novamente mais tarde.');
  }
}