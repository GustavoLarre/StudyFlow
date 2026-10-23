import { getSubjectProgressDb } from '../repositories/progressRepository.js';
import { db } from '../config/firebase.js';

export async function getGeneralProgress(req, res) {
  try {
    const subjectsSnap = await db.collection('subjects').get();
    const progressList = [];

    for (const doc of subjectsSnap.docs) {
      const progress = await getSubjectProgressDb(doc.id);
      progressList.push(progress);
    }

    return res.status(200).json(progressList);
  } catch (error) {
    console.error('Erro ao buscar progresso geral:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar progresso.' });
  }
}