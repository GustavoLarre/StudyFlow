import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'notes';

export async function createNoteDb(noteData) {
  const docRef = await db.collection(COLLECTION_NAME).add(noteData);
  return { noteId: docRef.id, ...noteData };
}

export async function getNotesBySubjectDb(subjectId) {
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('subjectId', '==', subjectId)
    .get();

  return snapshot.docs.map(doc => ({
    noteId: doc.id,
    ...doc.data()
  }));
}

export async function getNoteByIdDb(noteId) {
  const docRef = db.collection(COLLECTION_NAME).doc(noteId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  return { noteId: docSnap.id, ...docSnap.data() };
}

export async function updateNoteDb(noteId, updateData) {
  const docRef = db.collection(COLLECTION_NAME).doc(noteId);

  // update() falha se o documento não existir
  await docRef.update(updateData);

  const updatedSnap = await docRef.get();
  return { noteId: updatedSnap.id, ...updatedSnap.data() };
}

export async function deleteNoteDb(noteId) {
  await db.collection(COLLECTION_NAME).doc(noteId).delete();
}