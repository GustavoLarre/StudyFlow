import { getUsernameOwner } from '../repositories/usernameRepository.js';
import { validateUsername } from '../config/username.js';
import { ValidationError } from '../errors/AppError.js';

export async function checkUsernameAvailability(uid, rawName) {
  let username;
  try {
    username = validateUsername(rawName);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { available: false, reason: error.message };
    }
    throw error;
  }

  const owner = await getUsernameOwner(username);
  return { available: owner === null || owner === uid };
}