import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'users';

export async function getUserByUidDb(uid) {
  const docSnap = await db.collection(COLLECTION_NAME).doc(uid).get();

  if (!docSnap.exists) {
    return null;
  }

  return { uid: docSnap.id, ...docSnap.data() };
}

export async function createUserDb(user) {
  // create() falha se o documento já existir (atômico)
  await db.collection(COLLECTION_NAME).doc(user.uid).create(user);
  return user;
}

export async function updateUserDb(uid, data) {
  const docRef = db.collection(COLLECTION_NAME).doc(uid);

  // update() falha se o documento não existir
  await docRef.update(data);

  const updatedSnap = await docRef.get();
  return { uid: updatedSnap.id, ...updatedSnap.data() };
}