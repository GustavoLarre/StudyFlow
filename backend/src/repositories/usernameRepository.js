import { db } from '../config/firebase.js';
import { ForbiddenError, UsernameTakenError } from '../errors/AppError.js';

export async function claimUsername(uid, username) {
  const userRef = db.collection('users').doc(uid);
  const newRef = db.collection('usernames').doc(username);

  return await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new Error('Usuário não encontrado.');
    }

    const user = userSnap.data();
    const current = user.username ?? null;

    if (current === username) {
      return { username, usernameChanges: user.usernameChanges ?? 0 };
    }

    const changes = user.usernameChanges ?? 0;
    if (current && changes >= 1) {
      throw new ForbiddenError('Você já alterou seu nome de usuário e não pode mudar de novo.');
    }

    const newSnap = await tx.get(newRef);
    if (newSnap.exists) {
      throw new UsernameTakenError();
    }

    tx.set(newRef, { uid });
    if (current) {
      tx.delete(db.collection('usernames').doc(current));
    }
    const nextChanges = current ? changes + 1 : changes;
    tx.update(userRef, { username, usernameChanges: nextChanges });

    return { username, usernameChanges: nextChanges };
  });
}