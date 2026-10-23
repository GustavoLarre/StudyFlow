import { db } from '../config/firebase.js';

export async function getSubjectProgressDb(subjectId) {
  // 1. Busca a matéria
  const subjectDoc = await db.collection('subjects').doc(subjectId).get();
  
  if (!subjectDoc.exists) {
    return null;
  }

  const subjectData = subjectDoc.data();

  // 2. Busca todos os flashcards pertencentes a essa matéria
  const flashcardsSnap = await db.collection('flashcards')
    .where('subjectId', '==', subjectId)
    .get();

  const stats = {
    muitoFacil: 0,
    facil: 0,
    medio: 0,
    dificil: 0
  };

  flashcardsSnap.forEach(doc => {
    const data = doc.data();
    // Mapeamento do rating do SM-2 para as categorias da UI
    // Exemplo: 4 = Muito Fácil, 3 = Fácil, 2 = Médio, 1 = Difícil
    if (data.rating === 4) stats.muitoFacil++;
    else if (data.rating === 3) stats.facil++;
    else if (data.rating === 2) stats.medio++;
    else if (data.rating === 1) stats.dificil++;
  });

  return {
    subjectId,
    subjectName: subjectData.name,
    stats
  };
}