import { describe, it, expect } from '@jest/globals';
import { PLAN_IDS, buildNewUser } from '../../src/config/users.js';

describe('Unidade - Defaults do usuário', () => {
  it('Deve expor os ids de plano free e plus', () => {
    expect(PLAN_IDS).toEqual({ FREE: 'free', PLUS: 'plus' });
  });

  it('Deve montar um usuário novo com plano free, xp 0 e nível 1', () => {
    const user = buildNewUser({ uid: 'u1', email: 'a@b.com' });

    expect(user).toMatchObject({
      uid: 'u1',
      email: 'a@b.com',
      xp: 0,
      level: 1,
      plan: PLAN_IDS.FREE
    });
    expect(typeof user.createdAt).toBe('string');
    expect(typeof user.planUpdatedAt).toBe('string');
  });

  it('Deve aceitar usuário sem e-mail (ex.: conta anônima)', () => {
    const user = buildNewUser({ uid: 'u2' });

    expect(user.email).toBeNull();
  });
});