import { getUserByUidDb, createUserDb } from '../repositories/userRepository.js';
import { buildNewUser } from '../config/users.js';

const FIRESTORE_ALREADY_EXISTS = 6;

function isAlreadyExistsError(error) {
  return error?.code === FIRESTORE_ALREADY_EXISTS;
}

export async function ensureUser({ uid, email = null }) {
  const existing = await getUserByUidDb(uid);
  if (existing) {
    return existing;
  }

  try {
    return await createUserDb(buildNewUser({ uid, email }));
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
    // Outra requisição criou o usuário entre a leitura e a escrita
    return await getUserByUidDb(uid);
  }
}