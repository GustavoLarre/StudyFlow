import { generateFlashcardsFromText } from '../../src/services/aiClient.js';

describe('AI Client Service (Abstração da IA)', () => {
  it('Deve retornar uma lista de flashcards estruturados a partir de um texto de nota', async () => {
    const mockNoteContent = 'O ciclo TDD consiste em Red, Green e Refactor.';
    
    const flashcards = await generateFlashcardsFromText(mockNoteContent);

    expect(Array.isArray(flashcards)).toBe(true);
    expect(flashcards.length).toBeGreaterThan(0);
    expect(flashcards[0]).toHaveProperty('front');
    expect(flashcards[0]).toHaveProperty('back');
  });
});