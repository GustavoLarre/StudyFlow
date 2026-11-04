import { AppError } from './AppError.js';

export function handleError(res, error) {
  if (error instanceof AppError) {
    const body = { success: false, error: error.message };
    if (error.code) {
      body.code = error.code;
    }
    return res.status(error.statusCode).json(body);
  }

  console.error('Erro inesperado:', error);
  return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
}