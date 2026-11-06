import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'tasks';

const toTask = (doc) => ({ taskId: doc.id, ...doc.data() });

export async function createTaskDb(taskData) {
  const docRef = await db.collection(COLLECTION_NAME).add(taskData);
  return { taskId: docRef.id, ...taskData };
}

export async function getTasksByUserDb(userId) {
  const snapshot = await db.collection(COLLECTION_NAME).where('userId', '==', userId).get();
  return snapshot.docs.map(toTask);
}

export async function getTaskByIdDb(taskId) {
  const docSnap = await db.collection(COLLECTION_NAME).doc(taskId).get();
  return docSnap.exists ? toTask(docSnap) : null;
}

export async function updateTaskDb(taskId, updateData) {
  const docRef = db.collection(COLLECTION_NAME).doc(taskId);

  // update() falha se o documento não existir
  await docRef.update(updateData);

  return toTask(await docRef.get());
}

export async function deleteTaskDb(taskId) {
  await db.collection(COLLECTION_NAME).doc(taskId).delete();
}