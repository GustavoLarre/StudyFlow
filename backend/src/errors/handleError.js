import { AppError } from './AppError.js';

export function handleError(res, error) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  console.error('Erro inesperado:', error);
  return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
}