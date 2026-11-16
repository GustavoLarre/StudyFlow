import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  getUserByUidDb: jest.fn(),
  updateUserDb: jest.fn()
}));
jest.unstable_mockModule('../../src/repositories/usernameRepository.js', () => ({
  claimUsername: jest.fn()
}));

const userRepo = await import('../../src/repositories/userRepository.js');
const usernameRepo = await import('../../src/repositories/usernameRepository.js');
const { getProfile, updateProfile } = await import('../../src/services/profileService.js');
const { ValidationError } = await import('../../src/errors/AppError.js');

const USER = {
  uid: 'u1', email: 'a@b.com', plan: 'free', xp: 120, level: 2,
  username: 'gustavo', name: 'Gustavo', usage: { aiGenerations: { count: 2 } }, usernameChanges: 0
};

describe('Unidade - profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userRepo.getUserByUidDb.mockResolvedValue(USER);
    userRepo.updateUserDb.mockImplementation(async (uid, d) => ({ ...USER, ...d }));
    usernameRepo.claimUsername.mockResolvedValue({});
  });

  it('getProfile devolve só os campos públicos e o xp detalhado', async () => {
    const profile = await getProfile('u1');

    expect(profile).toEqual({
      uid: 'u1', email: 'a@b.com', plan: 'free', username: 'gustavo', name: 'Gustavo',
      xp: { total: 120, level: 2, currentLevelXp: 20, nextLevelXp: 200 }
    });
  });

  it('getProfile usa null quando não há username nem name', async () => {
    userRepo.getUserByUidDb.mockResolvedValue({ uid: 'u1', email: 'a@b.com', plan: 'free', xp: 0 });

    const profile = await getProfile('u1');

    expect(profile.username).toBeNull();
    expect(profile.name).toBeNull();
  });

  it('updateProfile exige username ou name', async () => {
    await expect(updateProfile('u1', {})).rejects.toBeInstanceOf(ValidationError);
    expect(usernameRepo.claimUsername).not.toHaveBeenCalled();
  });

  it('valida e normaliza o username antes de reservar', async () => {
    await updateProfile('u1', { username: 'Gustavo.Dev' });
    expect(usernameRepo.claimUsername).toHaveBeenCalledWith('u1', 'gustavo.dev');

    await expect(updateProfile('u1', { username: 'ab' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('aceita name aparado de 1 a 50 caracteres e rejeita fora disso', async () => {
    await updateProfile('u1', { name: '  Gu  ' });
    expect(userRepo.updateUserDb).toHaveBeenCalledWith('u1', { name: 'Gu' });

    await expect(updateProfile('u1', { name: '   ' })).rejects.toBeInstanceOf(ValidationError);
    await expect(updateProfile('u1', { name: 'a'.repeat(51) })).rejects.toBeInstanceOf(ValidationError);
  });

  it('não grava nada se algum campo for inválido', async () => {
    await expect(updateProfile('u1', { username: 'gustavo', name: '' })).rejects.toBeInstanceOf(ValidationError);

    expect(usernameRepo.claimUsername).not.toHaveBeenCalled();
    expect(userRepo.updateUserDb).not.toHaveBeenCalled();
  });

  it('com username e name, reserva o username e grava o name', async () => {
    await updateProfile('u1', { username: 'novo.nome', name: 'Novo' });

    expect(usernameRepo.claimUsername).toHaveBeenCalledWith('u1', 'novo.nome');
    expect(userRepo.updateUserDb).toHaveBeenCalledWith('u1', { name: 'Novo' });
  });
});