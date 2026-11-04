import { db } from '../config/firebase.js';
import { PlanLimitError, ConflictError } from '../errors/AppError.js';

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

export async function reserveAiGeneration(uid, { limit, lockMs, now = new Date() }) {
  const docRef = db.collection(COLLECTION_NAME).doc(uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      throw new Error('Usuário não encontrado.');
    }

    const usage = snap.data().usage ?? {};
    let count = usage.aiGenerations?.count ?? 0;
    const inFlight = usage.aiInFlight ?? null;

    if (inFlight) {
      if (new Date(inFlight.expiresAt) > now) {
        throw new ConflictError();
      }
      // Trava morta (servidor caiu no meio): devolve a cota daquela tentativa
      count = Math.max(0, count - 1);
    }

    if (count >= limit) {
      throw new PlanLimitError('Você atingiu o limite de gerações por IA do seu plano.');
    }

    count += 1;

    tx.update(docRef, {
      'usage.aiGenerations.count': count,
      'usage.aiInFlight': {
        startedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + lockMs).toISOString()
      }
    });

    return { count, limit };
  });
}

export async function releaseAiGeneration(uid, { refund = false } = {}) {
  const docRef = db.collection(COLLECTION_NAME).doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      return;
    }

    const count = snap.data().usage?.aiGenerations?.count ?? 0;
    const update = { 'usage.aiInFlight': null };

    if (refund) {
      update['usage.aiGenerations.count'] = Math.max(0, count - 1);
    }

    tx.update(docRef, update);
  });
}