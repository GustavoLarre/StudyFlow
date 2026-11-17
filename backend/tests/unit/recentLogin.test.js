import { describe, it, expect } from '@jest/globals';
import { requireRecentLogin, RECENT_LOGIN_SECONDS } from '../../src/middlewares/recentLogin.js';
import { ReauthRequiredError } from '../../src/errors/AppError.js';

const NOW = new Date('2026-01-01T12:00:00.000Z');
const nowSeconds = Math.floor(NOW.getTime() / 1000);

describe('Unidade - requireRecentLogin', () => {
  it('a janela é de 5 minutos', () => {
    expect(RECENT_LOGIN_SECONDS).toBe(300);
  });

  it.each([0, 60, 300])('aceita login há %i segundos', (age) => {
    expect(() => requireRecentLogin({ auth_time: nowSeconds - age }, NOW)).not.toThrow();
  });

  it.each([
    [{ auth_time: nowSeconds - 301 }],
    [{ auth_time: nowSeconds - 86400 }],
    [{}],
    [undefined],
    [{ auth_time: 'abc' }]
  ])('rejeita %p', (auth) => {
    expect(() => requireRecentLogin(auth, NOW)).toThrow(ReauthRequiredError);
  });
});