import { getUserByUidDb, updateUserDb } from '../repositories/userRepository.js';
import { claimUsername } from '../repositories/usernameRepository.js';
import { validateUsername } from '../config/username.js';
import { getLevelProgress } from './gamificationService.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';

const MAX_NAME = 50;

function normalizeName(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError('O nome é obrigatório.');
  }
  const name = value.trim();
  if (name.length > MAX_NAME) {
    throw new ValidationError(`O nome deve ter no máximo ${MAX_NAME} caracteres.`);
  }
  return name;
}

export async function getProfile(uid) {
  const user = await getUserByUidDb(uid);
  if (!user) throw new NotFoundError('Usuário não encontrado.');

  const { level, currentLevelXp, nextLevelXp } = getLevelProgress(user.xp);

  return {
    uid: user.uid,
    email: user.email ?? null,
    plan: user.plan,
    username: user.username ?? null,
    name: user.name ?? null,
    usernameChanged: (user.usernameChanges ?? 0) >= 1,
    xp: { total: user.xp ?? 0, level, currentLevelXp, nextLevelXp }
  };
}

export async function updateProfile(uid, { username, name } = {}) {
  if (username === undefined && name === undefined) {
    throw new ValidationError('Informe o nome de usuário ou o nome.');
  }

  // Valida tudo antes de gravar
  const validUsername = username !== undefined ? validateUsername(username) : undefined;
  const validName = name !== undefined ? normalizeName(name) : undefined;

  if (validUsername !== undefined) await claimUsername(uid, validUsername);
  if (validName !== undefined) await updateUserDb(uid, { name: validName });

  return await getProfile(uid);
}