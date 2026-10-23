import { 
  createFlashcardDb, 
  getFlashcardsByNoteDb, 
  getFlashcardByIdDb, 
  updateFlashcardDb, 
  getDueFlashcardsDb 
} from '../../src/repositories/flashcardRepository.js';

describe('Repositório de Flashcards - Firestore (SM-2 & Gestão)', () => {
  const mockNoteId = `note_test_${Date.now()}`;
  let createdFlashcardId;

  it('Deve criar um flashcard manual no Firestore com sucesso', async () => {
    const flashcardData = {
      noteId: mockNoteId,
      front: 'O que é um ponteiro em C?',
      back: 'Uma variável que armazena o endereço de memória de outra.',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString()
    };

    const result = await createFlashcardDb(flashcardData);

    expect(result).toHaveProperty('flashcardId');
    expect(result.front).toBe(flashcardData.front);
    expect(result.noteId).toBe(mockNoteId);

    createdFlashcardId = result.flashcardId;
  });

  it('Deve buscar flashcards pelo ID da nota', async () => {
    const cards = await getFlashcardsByNoteDb(mockNoteId);

    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBeGreaterThan(0);
    
    const found = cards.find(c => c.flashcardId === createdFlashcardId);
    expect(found).toBeDefined();
    expect(found.front).toBe('O que é um ponteiro em C?');
  });

  it('Deve buscar um flashcard específico pelo ID', async () => {
    const card = await getFlashcardByIdDb(createdFlashcardId);

    expect(card).not.toBeNull();
    expect(card).toHaveProperty('flashcardId', createdFlashcardId);
    expect(card.back).toContain('endereço de memória');
  });

  it('Deve atualizar os parâmetros SM-2 do flashcard após uma revisão', async () => {
    const updatePayload = {
      interval: 1,
      repetition: 1,
      easeFactor: 2.6,
      dueDate: new Date(Date.now() + 86400000).toISOString() // Amanhã
    };

    const updatedCard = await updateFlashcardDb(createdFlashcardId, updatePayload);

    expect(updatedCard.interval).toBe(1);
    expect(updatedCard.repetition).toBe(1);
    expect(updatedCard.easeFactor).toBe(2.6);
  });

  it('Deve listar flashcards vencidos para revisão (due)', async () => {
    // Cria um card explicitamente vencido (com dueDate no passado)
    const overdueCardData = {
      noteId: mockNoteId,
      front: 'Card Vencido',
      back: 'Teste de revisão vencida',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
    };

    const inserted = await createFlashcardDb(overdueCardData);

    const nowIso = new Date().toISOString();
    const dueCards = await getDueFlashcardsDb(nowIso);

    expect(Array.isArray(dueCards)).toBe(true);
    const found = dueCards.find(c => c.flashcardId === inserted.flashcardId);
    expect(found).toBeDefined();
  });
});