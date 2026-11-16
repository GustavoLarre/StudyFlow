import { ValidationError } from '../errors/AppError.js';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const RESERVED_USERNAMES = Object.freeze(['admin', 'studyflow', 'suporte', 'api', 'root']);

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateUsername(value) {
  if (typeof value !== 'string') {
    throw new ValidationError('O nome de usuário é obrigatório.');
  }

  const username = normalizeUsername(value);

  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    throw new ValidationError(`O nome de usuário deve ter de ${USERNAME_MIN} a ${USERNAME_MAX} caracteres.`);
  }
  if (!/^[a-z0-9._]+$/.test(username)) {
    throw new ValidationError('Use apenas letras, números, ponto e sublinhado.');
  }
  if (/^\d+$/.test(username)) {
    throw new ValidationError('O nome de usuário não pode ter só números.');
  }
  if (RESERVED_USERNAMES.includes(username)) {
    throw new ValidationError('Esse nome de usuário não está disponível.');
  }

  return username;
}