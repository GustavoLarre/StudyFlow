import { getUserByUidDb } from '../repositories/userRepository.js';
import { getSubjectsByUserDb } from '../repositories/subjectRepository.js';
import { getFlashcardsByUserDb } from '../repositories/flashcardRepository.js';
import { getLevelProgress } from './gamificationService.js';

const CATEGORY_BY_RATING = { 4: 'muitoFacil', 3: 'facil', 2: 'medio', 1: 'dificil' };

const emptyStats = () => ({ novo: 0, muitoFacil: 0, facil: 0, medio: 0, dificil: 0 });

function categoryOf(card) {
  if (card.state === 'new') return 'novo';
  return CATEGORY_BY_RATING[card.rating] ?? 'novo';
}

export async function getProgress(userId) {
  const [user, subjects, cards] = await Promise.all([
    getUserByUidDb(userId),
    getSubjectsByUserDb(userId),
    getFlashcardsByUserDb(userId)
  ]);

  const { level, currentLevelXp, nextLevelXp } = getLevelProgress(user?.xp);

  const bySubject = new Map(
    subjects.map((s) => [s.subjectId, { subjectId: s.subjectId, title: s.title, total: 0, stats: emptyStats() }])
  );

  for (const card of cards) {
    const entry = bySubject.get(card.subjectId);
    if (!entry) continue;

    entry.stats[categoryOf(card)] += 1;
    entry.total += 1;
  }

  return {
    xp: { total: user?.xp ?? 0, level, currentLevelXp, nextLevelXp },
    subjects: [...bySubject.values()]
  };
}