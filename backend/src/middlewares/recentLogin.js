import { ReauthRequiredError } from '../errors/AppError.js';

export const RECENT_LOGIN_SECONDS = 300;

export function requireRecentLogin(auth, now = new Date()) {
  const authTime = auth?.auth_time;

  if (typeof authTime !== 'number') {
    throw new ReauthRequiredError();
  }

  const age = Math.floor(now.getTime() / 1000) - authTime;
  if (age > RECENT_LOGIN_SECONDS) {
    throw new ReauthRequiredError();
  }
}