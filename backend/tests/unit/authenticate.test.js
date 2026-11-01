import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/services/userService.js', () => ({
  ensureUser: jest.fn()
}));

const { createAuthenticate } = await import('../../src/middlewares/authenticate.js');
const { ensureUser } = await import('../../src/services/userService.js');

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Unidade - middleware authenticate', () => {
  let verifyToken;
  let authenticate;
  let next;

  beforeEach(() => {
    verifyToken = jest.fn();
    authenticate = createAuthenticate({ verifyToken });
    next = jest.fn();
  });

  it('Deve responder 401 quando não há header Authorization', async () => {
    const res = buildRes();

    await authenticate({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token de autenticação ausente.'
    });
    expect(next).not.toHaveBeenCalled();
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('Deve responder 401 quando o header não usa o prefixo Bearer', async () => {
    const res = buildRes();

    await authenticate({ headers: { authorization: 'Basic abc' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('Deve responder 401 quando o token é inválido ou expirado', async () => {
    verifyToken.mockRejectedValue(new Error('auth/id-token-expired'));
    const res = buildRes();

    await authenticate({ headers: { authorization: 'Bearer token_ruim' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token inválido ou expirado.'
    });
    expect(next).not.toHaveBeenCalled();
    expect(ensureUser).not.toHaveBeenCalled();
  });

  it('Deve injetar req.user e chamar next() quando o token é válido', async () => {
    verifyToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com' });
    const dbUser = { uid: 'u1', email: 'a@b.com', plan: 'free', xp: 0, level: 1 };
    ensureUser.mockResolvedValue(dbUser);
    const req = { headers: { authorization: 'Bearer token_bom' } };
    const res = buildRes();

    await authenticate(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('token_bom');
    expect(ensureUser).toHaveBeenCalledWith({ uid: 'u1', email: 'a@b.com' });
    expect(req.user).toEqual(dbUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('Deve responder 500 quando falha ao buscar ou criar o usuário', async () => {
    verifyToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com' });
    ensureUser.mockRejectedValue(new Error('Firestore indisponível'));
    const res = buildRes();

    await authenticate({ headers: { authorization: 'Bearer token_bom' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});