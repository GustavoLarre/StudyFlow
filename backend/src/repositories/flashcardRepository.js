import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'flashcards';

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

  return snapshot.docs.map(doc => ({
    flashcardId: doc.id,
    ...doc.data()
  }));
}

export async function getFlashcardByIdDb(flashcardId) {
  const docRef = db.collection(COLLECTION_NAME).doc(flashcardId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  return { flashcardId: docSnap.id, ...docSnap.data() };
}

export async function updateFlashcardDb(flashcardId, updateData) {
  const docRef = db.collection(COLLECTION_NAME).doc(flashcardId);
  await docRef.update(updateData);
  
  const updatedSnap = await docRef.get();
  return { flashcardId: updatedSnap.id, ...updatedSnap.data() };
}

export async function getDueFlashcardsDb(currentDateIso) {
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('dueDate', '<=', currentDateIso)
    .get();

  return snapshot.docs.map(doc => ({
    flashcardId: doc.id,
    ...doc.data()
  }));
}