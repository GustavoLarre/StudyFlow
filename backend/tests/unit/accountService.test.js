import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/accountRepository.js', () => ({
  deleteSubjectsOfUser: jest.fn(),
  deleteCardsOfUser: jest.fn(),
  deleteNotesOfUser: jest.fn(),
  deleteTasksOfUser: jest.fn(),
  deleteUsernameDoc: jest.fn(),
  deleteUserDoc: jest.fn()
}));
jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  getUserByUidDb: jest.fn()
}));

const repo = await import('../../src/repositories/accountRepository.js');
const userRepo = await import('../../src/repositories/userRepository.js');
const { deleteAccount } = await import('../../src/services/accountService.js');

describe('Unidade - deleteAccount', () => {
  const order = [];
  let deleteAuthUser;

  beforeEach(() => {
    jest.clearAllMocks();
    order.length = 0;
    userRepo.getUserByUidDb.mockResolvedValue({ uid: 'u1', username: 'gustavo' });
    for (const name of Object.keys(repo)) {
      repo[name].mockImplementation(async () => { order.push(name); });
    }
    deleteAuthUser = jest.fn(async () => { order.push('deleteAuthUser'); });
  });

  it('apaga tudo na ordem e a conta de login por último', async () => {
    await deleteAccount('u1', { deleteAuthUser });

    expect(order).toEqual([
      'deleteSubjectsOfUser', 'deleteCardsOfUser', 'deleteNotesOfUser',
      'deleteTasksOfUser', 'deleteUsernameDoc', 'deleteUserDoc', 'deleteAuthUser'
    ]);
    expect(repo.deleteUsernameDoc).toHaveBeenCalledWith('gustavo');
    expect(deleteAuthUser).toHaveBeenCalledWith('u1');
  });

  it('sem username, não tenta liberar nome', async () => {
    userRepo.getUserByUidDb.mockResolvedValue({ uid: 'u1' });
    await deleteAccount('u1', { deleteAuthUser });
    expect(repo.deleteUsernameDoc).not.toHaveBeenCalled();
  });

  it('documento de usuário já apagado: continua e apaga o Auth (idempotente)', async () => {
    userRepo.getUserByUidDb.mockResolvedValue(null);
    await deleteAccount('u1', { deleteAuthUser });
    expect(deleteAuthUser).toHaveBeenCalledWith('u1');
  });

  it('se uma etapa falha, não apaga o Auth', async () => {
    repo.deleteTasksOfUser.mockRejectedValue(new Error('falha'));
    await expect(deleteAccount('u1', { deleteAuthUser })).rejects.toThrow('falha');
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });
});