import { getSubjectProgressDb } from '../../src/repositories/progressRepository.js';
import { createSubjectDb } from '../../src/repositories/subjectRepository.js';
import { createFlashcardDb, updateFlashcardDb } from '../../src/repositories/flashcardRepository.js';

describe('Módulo de Progresso e Estatísticas - Firestore', () => {
  it('Deve agregar corretamente as estatísticas de dificuldade dos flashcards por matéria', async () => {
    // 1. Cria uma matéria de teste
    const subject = await createSubjectDb({ name: 'Arquitetura de Computadores' });
    const subjectId = subject.subjectId;

    // 2. Cria notas/flashcards vinculados a essa matéria simulando diferentes ratings
    // ratings armazenados no flashcard: 1 (Difícil), 2 (Médio), 3 (Fácil), 4 (Muito Fácil)
    const card1 = await createFlashcardDb({
      subjectId,
      noteId: 'note_1',
      front: 'O que é pipeline?',
      back: 'Sobreposição de instruções',
      rating: 4 // Muito Fácil
    });

    const card2 = await createFlashcardDb({
      subjectId,
      noteId: 'note_1',
      front: 'O que é cache L1?',
      back: 'Memória ultrarrápida',
      rating: 1 // Difícil
    });

    const card3 = await createFlashcardDb({
      subjectId,
      noteId: 'note_1',
      front: 'O que é RAM?',
      back: 'Memória principal',
      rating: 3 // Fácil
    });

    // 3. Busca o progresso agregado da matéria
    const progress = await getSubjectProgressDb(subjectId);

    expect(progress).toBeDefined();
    expect(progress).toHaveProperty('subjectName', 'Arquitetura de Computadores');
    expect(progress.stats).toEqual({
      muitoFacil: 1,
      facil: 1,
      medio: 0,
      dificil: 1
    });
  });
});