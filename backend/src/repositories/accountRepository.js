import { db } from '../config/firebase.js';
import { getSubjectsByUserDb, deleteSubjectCascadeDb } from './subjectRepository.js';

const BATCH = 500;

async function deleteByUser(collection, uid) {
  while (true) {
    const snap = await db.collection(collection).where('userId', '==', uid).limit(BATCH).get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function deleteSubjectsOfUser(uid) {
  const subjects = await getSubjectsByUserDb(uid);
  for (const s of subjects) await deleteSubjectCascadeDb(s.subjectId);
}

export const deleteCardsOfUser = (uid) => deleteByUser('flashcards', uid);
export const deleteNotesOfUser = (uid) => deleteByUser('notes', uid);
export const deleteTasksOfUser = (uid) => deleteByUser('tasks', uid);

export async function deleteUsernameDoc(username) {
  await db.collection('usernames').doc(username).delete();
}

export async function deleteUserDoc(uid) {
  await db.collection('users').doc(uid).delete();
}