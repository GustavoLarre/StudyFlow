import { ensureUser } from '../services/userService.js';

export function createAuthenticate({ verifyToken }) {
  if (typeof verifyToken !== 'function') {
    throw new Error('createAuthenticate exige a função verifyToken.');
  }

  return async function authenticate(req, res, next) {
    const header = req.headers?.authorization || '';

    if (!header.startsWith('Bearer ') || header.length <= 'Bearer '.length) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação ausente.'
      });
    }

    const token = header.slice('Bearer '.length);

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado.'
      });
    }

    try {
      req.user = await ensureUser({ uid: decoded.uid, email: decoded.email ?? null });
    } catch (error) {
      console.error('Falha ao carregar o usuário autenticado:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao carregar o usuário.'
      });
    }

    return next();
  };
}