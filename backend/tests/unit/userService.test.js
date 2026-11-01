import { jest, describe, it, expect } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  getUserByUidDb: jest.fn(),
  createUserDb: jest.fn(),
  updateUserDb: jest.fn()
}));

const { ensureUser } = await import('../../src/services/userService.js');
const userRepository = await import('../../src/repositories/userRepository.js');

const ALREADY_EXISTS = Object.assign(new Error('6 ALREADY_EXISTS'), { code: 6 });

describe('Unidade - userService.ensureUser', () => {
  it('Deve retornar o usuário existente sem criar outro', async () => {
    const existing = { uid: 'u1', email: 'a@b.com', xp: 40, level: 1, plan: 'free' };
    userRepository.getUserByUidDb.mockResolvedValue(existing);

    const result = await ensureUser({ uid: 'u1', email: 'a@b.com' });

    expect(result).toEqual(existing);
    expect(userRepository.createUserDb).not.toHaveBeenCalled();
  });

  it('Deve criar o usuário no primeiro acesso com plano free, xp 0 e nível 1', async () => {
    userRepository.getUserByUidDb.mockResolvedValue(null);
    userRepository.createUserDb.mockImplementation(async (user) => user);

    const result = await ensureUser({ uid: 'u2', email: 'novo@b.com' });

    expect(userRepository.createUserDb).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      uid: 'u2',
      email: 'novo@b.com',
      xp: 0,
      level: 1,
      plan: 'free'
    });
  });

  it('Deve buscar o usuário já criado quando outra requisição o criou antes (corrida)', async () => {
    const created = { uid: 'u3', email: 'c@b.com', xp: 0, level: 1, plan: 'free' };
    userRepository.getUserByUidDb
      .mockResolvedValueOnce(null)      // 1ª leitura: ainda não existe
      .mockResolvedValueOnce(created);  // releitura após conflito
    userRepository.createUserDb.mockRejectedValue(ALREADY_EXISTS);

    const result = await ensureUser({ uid: 'u3', email: 'c@b.com' });

    expect(result).toEqual(created);
    expect(userRepository.getUserByUidDb).toHaveBeenCalledTimes(2);
  });

  it('Deve propagar erros que não sejam "já existe"', async () => {
    userRepository.getUserByUidDb.mockResolvedValue(null);
    userRepository.createUserDb.mockRejectedValue(new Error('Firestore indisponível'));

    await expect(ensureUser({ uid: 'u4' })).rejects.toThrow('Firestore indisponível');
  });
});