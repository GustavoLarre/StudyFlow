import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'flashcards';

function toCard(doc) {
  return { flashcardId: doc.id, ...doc.data() };
}

export async function createFlashcardDb(flashcardData) {
  const docRef = await db.collection(COLLECTION_NAME).add(flashcardData);
  return { flashcardId: docRef.id, ...flashcardData };
}

export async function createManyFlashcardsDb(flashcardsArray) {
  const batch = db.batch();
  const createdCards = [];

  for (const card of flashcardsArray) {
    const docRef = db.collection(COLLECTION_NAME).doc();
    batch.set(docRef, card);
    createdCards.push({ flashcardId: docRef.id, ...card });
  }

  await batch.commit();
  return createdCards;
}

export async function getFlashcardsByNoteDb(noteId) {
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('noteId', '==', noteId)
    .get();

  return snapshot.docs.map(toCard);
}

export async function getFlashcardsBySubjectDb(subjectId) {
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('subjectId', '==', subjectId)
    .get();

  return snapshot.docs.map(toCard);
}

export async function getFlashcardByIdDb(flashcardId) {
  const docSnap = await db.collection(COLLECTION_NAME).doc(flashcardId).get();

  if (!docSnap.exists) {
    return null;
  }

  return toCard(docSnap);
}

export async function updateFlashcardDb(flashcardId, updateData) {
  const docRef = db.collection(COLLECTION_NAME).doc(flashcardId);

  // update() falha se o documento não existir
  await docRef.update(updateData);

  return toCard(await docRef.get());
}

export async function deleteFlashcardDb(flashcardId) {
  await db.collection(COLLECTION_NAME).doc(flashcardId).delete();
}

export async function getDueFlashcardsDb(userId, nowIso, { subjectId } = {}) {
  let query = db.collection(COLLECTION_NAME).where('userId', '==', userId);

  if (subjectId) {
    query = query.where('subjectId', '==', subjectId);
  }

  const snapshot = await query.where('dueDate', '<=', nowIso).get();

  return snapshot.docs.map(toCard);
}