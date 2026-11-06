import {
  createTaskDb, getTasksByUserDb, getTaskByIdDb, updateTaskDb, deleteTaskDb
} from '../repositories/taskRepository.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';

export const MAX_TASK_TEXT = 300;

function normalizeText(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new ValidationError('O texto da tarefa é obrigatório.');
  }

  const trimmed = text.trim();
  if (trimmed.length > MAX_TASK_TEXT) {
    throw new ValidationError(`O texto deve ter no máximo ${MAX_TASK_TEXT} caracteres.`);
  }

  return trimmed;
}

function normalizeDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ValidationError('A data deve estar no formato AAAA-MM-DD.');
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new ValidationError('Data inválida.');
  }

  return date;
}

async function getOwnedTask(userId, taskId) {
  const task = await getTaskByIdDb(taskId);
  if (!task || task.userId !== userId) {
    throw new NotFoundError('Tarefa não encontrada.');
  }
  return task;
}

export async function createTask({ userId, date, text, now = new Date() }) {
  const normalized = { date: normalizeDate(date), text: normalizeText(text) };
  const stamp = now.toISOString();

  return await createTaskDb({
    userId,
    ...normalized,
    completed: false,
    completedAt: null,
    createdAt: stamp,
    updatedAt: stamp
  });
}

export async function listTasks(userId) {
  return await getTasksByUserDb(userId);
}

export async function updateTask({ userId, taskId, date, text, now = new Date() }) {
  const changes = {};
  if (text !== undefined) changes.text = normalizeText(text);
  if (date !== undefined) changes.date = normalizeDate(date);

  if (Object.keys(changes).length === 0) {
    throw new ValidationError('Informe o texto ou a data para atualizar.');
  }

  await getOwnedTask(userId, taskId);

  return await updateTaskDb(taskId, { ...changes, updatedAt: now.toISOString() });
}

export async function setTaskCompleted({ userId, taskId, completed = true, now = new Date() }) {
  if (typeof completed !== 'boolean') {
    throw new ValidationError('O campo completed deve ser verdadeiro ou falso.');
  }

  await getOwnedTask(userId, taskId);

  const stamp = now.toISOString();
  return await updateTaskDb(taskId, {
    completed,
    completedAt: completed ? stamp : null,
    updatedAt: stamp
  });
}

export async function deleteTask({ userId, taskId }) {
  await getOwnedTask(userId, taskId);
  await deleteTaskDb(taskId);
}