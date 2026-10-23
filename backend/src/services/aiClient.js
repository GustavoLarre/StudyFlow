/**
 * Client responsável por interagir com o microsserviço de IA.
 * Nesta fase inicial, retorna dados mockados/estáticos para isolar o backend.
 */
export async function generateFlashcardsFromText(text) {
  if (!text) {
    throw new Error('O conteúdo da nota não pode estar vazio.');
  }

  // Simulação de resposta que futuramente virá do Python (ai-service)
  return [
    {
      front: 'O que significa TDD?',
      back: 'Test-Driven Development (Desenvolvimento Orientado a Testes).'
    },
    {
      front: 'Quais são as três fases principais do TDD?',
      back: 'Red, Green e Refactor.'
    }
  ];
}