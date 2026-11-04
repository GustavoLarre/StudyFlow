import { BadGatewayError, GatewayTimeoutError } from '../errors/AppError.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 120000;

function isTimeout(error) {
  return error?.name === 'TimeoutError' || error?.name === 'AbortError';
}

export async function generateFlashcardsFromText(
  title,
  content,
  customFetch = (...args) => globalThis.fetch(...args)
) {
  let response;

  try {
    response = await customFetch(`${AI_SERVICE_URL}/generate-flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
      signal: AbortSignal.timeout(AI_SERVICE_TIMEOUT_MS)
    });
  } catch (error) {
    console.error('Falha na comunicação com ai-service:', error.message);
    if (isTimeout(error)) {
      throw new GatewayTimeoutError();
    }
    throw new BadGatewayError();
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`ai-service respondeu ${response.status}:`, detail);
    throw new BadGatewayError();
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error('Resposta inválida do ai-service:', error.message);
    throw new BadGatewayError();
  }

  const flashcards = Array.isArray(data) ? data : data?.flashcards;

  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    console.error('ai-service não retornou flashcards válidos.');
    throw new BadGatewayError();
  }

  return flashcards;
}