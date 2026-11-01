import {
  createSubjectDb,
  getSubjectsByUserDb,
  getSubjectByIdDb,
  updateSubjectDb,
  deleteSubjectCascadeDb
} from '../repositories/subjectRepository.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';

const MAX_TITLE_LENGTH = 100;

function normalizeTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('O título da matéria é obrigatório.');
  }

  const trimmed = title.trim();
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`O título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.`);
  }

  return trimmed;
}

async function getOwnedSubject(userId, subjectId) {
  const subject = await getSubjectByIdDb(subjectId);

  // Inexistente e de outro usuário respondem igual: não vaza que o ID existe
  if (!subject || subject.userId !== userId) {
    throw new NotFoundError('Matéria não encontrada.');
  }

  return subject;
}

export async function createSubject({ userId, title }) {
  const now = new Date().toISOString();

  return await createSubjectDb({
    userId,
    title: normalizeTitle(title),
    createdAt: now,
    updatedAt: now
  });
}

export async function getAllSubjects(userId) {
  return await getSubjectsByUserDb(userId);
}

export async function getSubject({ userId, subjectId }) {
  return await getOwnedSubject(userId, subjectId);
}

export async function updateSubject({ userId, subjectId, title }) {
  const normalized = normalizeTitle(title);
  await getOwnedSubject(userId, subjectId);

  return await updateSubjectDb(subjectId, {
    title: normalized,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteSubject({ userId, subjectId }) {
  await getOwnedSubject(userId, subjectId);

  return await deleteSubjectCascadeDb(subjectId);
}