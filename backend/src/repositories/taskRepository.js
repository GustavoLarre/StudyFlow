import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'tasks';

export async function createTaskDb(taskData) {
  const docRef = await db.collection(COLLECTION_NAME).add(taskData);
  return { taskId: docRef.id, ...taskData };
}

export async function getTasksDb() {
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('completed', '==', false)
    .get();

  return snapshot.docs.map(doc => ({
    taskId: doc.id,
    ...doc.data()
  }));
}

export async function completeAndDeleteTaskDb(taskId) {
  const docRef = db.collection(COLLECTION_NAME).doc(taskId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return false;
  }

  // Deleta o documento do Firestore imediatamente após a conclusão
  await docRef.delete();
  return true;
}