import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'subjects';
const MAX_BATCH_SIZE = 500;

export async function createSubjectDb(subjectData) {
  const docRef = await db.collection(COLLECTION_NAME).add(subjectData);
  return { subjectId: docRef.id, ...subjectData };
}

export async function getSubjectsByUserDb(userId) {
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.map(doc => ({
    subjectId: doc.id,
    ...doc.data()
  }));
}

export async function getSubjectByIdDb(subjectId) {
  const docSnap = await db.collection(COLLECTION_NAME).doc(subjectId).get();

  if (!docSnap.exists) {
    return null;
  }

  return { subjectId: docSnap.id, ...docSnap.data() };
}

export async function updateSubjectDb(subjectId, updateData) {
  const docRef = db.collection(COLLECTION_NAME).doc(subjectId);

  // update() falha se o documento não existir
  await docRef.update(updateData);

  const updatedSnap = await docRef.get();
  return { subjectId: updatedSnap.id, ...updatedSnap.data() };
}

async function deleteByField(collectionName, field, value, batchSize) {
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection(collectionName)
      .where(field, '==', value)
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      return deleted;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    deleted += snapshot.size;
  }
}

export async function deleteSubjectCascadeDb(subjectId, { batchSize = MAX_BATCH_SIZE } = {}) {
  const size = Math.min(batchSize, MAX_BATCH_SIZE);

  const notes = await deleteByField('notes', 'subjectId', subjectId, size);
  const flashcards = await deleteByField('flashcards', 'subjectId', subjectId, size);

  await db.collection(COLLECTION_NAME).doc(subjectId).delete();

  return { notes, flashcards };
}