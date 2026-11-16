import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/usernameRepository.js', () => ({
  claimUsername: jest.fn(),
  getUsernameOwner: jest.fn()
}));

const repo = await import('../../src/repositories/usernameRepository.js');
const { checkUsernameAvailability } = await import('../../src/services/usernameService.js');

describe('Unidade - checkUsernameAvailability', () => {
  beforeEach(() => jest.clearAllMocks());

  it('livre: disponível', async () => {
    repo.getUsernameOwner.mockResolvedValue(null);
    expect(await checkUsernameAvailability('u1', 'Gustavo')).toEqual({ available: true });
    expect(repo.getUsernameOwner).toHaveBeenCalledWith('gustavo');
  });

  it('em uso por outro: indisponível', async () => {
    repo.getUsernameOwner.mockResolvedValue('u2');
    expect(await checkUsernameAvailability('u1', 'gustavo')).toEqual({ available: false });
  });

  it('em uso pelo próprio usuário: disponível', async () => {
    repo.getUsernameOwner.mockResolvedValue('u1');
    expect(await checkUsernameAvailability('u1', 'gustavo')).toEqual({ available: true });
  });

  it('formato inválido: indisponível com motivo, sem consultar o banco', async () => {
    const result = await checkUsernameAvailability('u1', 'ab');
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/3 a 30/);
    expect(repo.getUsernameOwner).not.toHaveBeenCalled();
  });
});