import { describe, it, expect } from '@jest/globals';
import { validateUsername, normalizeUsername } from '../../src/config/username.js';
import { ValidationError } from '../../src/errors/AppError.js';

describe('Unidade - username', () => {
  it('normaliza para minúsculas e apara espaços nas pontas', () => {
    expect(normalizeUsername('  Gustavo.Dev ')).toBe('gustavo.dev');
  });

  it.each(['abc', 'gustavo.dev', 'user_1', '_ab', 'ab.', 'a..b', 'a1b', 'a'.repeat(30)])(
    'aceita %s', (value) => {
      expect(validateUsername(value)).toBe(value.trim().toLowerCase());
    });

  it.each([
    [undefined], [null], [5], [''], ['ab'], ['a'.repeat(31)],
    ['com espaço'], ['usuário'], ['a-b'], ['a@b'], ['12345'],
    ['admin'], ['ADMIN'], ['studyflow'], ['suporte'], ['api'], ['root']
  ])('rejeita %p', (value) => {
    expect(() => validateUsername(value)).toThrow(ValidationError);
  });
});