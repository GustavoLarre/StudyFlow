import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'subjects';

export async function createSubjectDb(subjectData) {
  const docRef = await db.collection(COLLECTION_NAME).add(subjectData);
  return { subjectId: docRef.id, ...subjectData };
}

export async function getSubjectsDb() {
  const snapshot = await db.collection(COLLECTION_NAME).get();

  return snapshot.docs.map(doc => ({
    subjectId: doc.id,
    ...doc.data()
  }));
}

export async function getSubjectByIdDb(subjectId) {
  const docRef = db.collection(COLLECTION_NAME).doc(subjectId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  return { subjectId: docSnap.id, ...docSnap.data() };
}