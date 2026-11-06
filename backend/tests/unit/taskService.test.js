import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../src/repositories/taskRepository.js', () => ({
  createTaskDb: jest.fn(),
  getTasksByUserDb: jest.fn(),
  getTaskByIdDb: jest.fn(),
  updateTaskDb: jest.fn(),
  deleteTaskDb: jest.fn()
}));

const repo = await import('../../src/repositories/taskRepository.js');
const {
  createTask, listTasks, updateTask, setTaskCompleted, deleteTask, MAX_TASK_TEXT
} = await import('../../src/services/taskService.js');
const { ValidationError, NotFoundError } = await import('../../src/errors/AppError.js');

const NOW = new Date('2026-01-01T12:00:00.000Z');
const OWN = { taskId: 't1', userId: 'u1', date: '2026-10-23', text: 'a', completed: false };
const OTHERS = { ...OWN, taskId: 't2', userId: 'u2' };

describe('Unidade - taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repo.createTaskDb.mockImplementation(async (d) => ({ taskId: 't1', ...d }));
    repo.updateTaskDb.mockImplementation(async (id, d) => ({ ...OWN, ...d }));
    repo.getTaskByIdDb.mockResolvedValue(OWN);
  });

  describe('createTask', () => {
    it('Cria com userId, texto aparado, completed false e datas', async () => {
      const result = await createTask({ userId: 'u1', date: '2026-10-23', text: '  Estudar  ', now: NOW });

      expect(repo.createTaskDb).toHaveBeenCalledWith({
        userId: 'u1', date: '2026-10-23', text: 'Estudar', completed: false, completedAt: null,
        createdAt: NOW.toISOString(), updatedAt: NOW.toISOString()
      });
      expect(result.taskId).toBe('t1');
    });

    it.each([[undefined], [''], ['   '], [5]])('Rejeita texto inválido (%p)', async (text) => {
      await expect(createTask({ userId: 'u1', date: '2026-10-23', text }))
        .rejects.toBeInstanceOf(ValidationError);
      expect(repo.createTaskDb).not.toHaveBeenCalled();
    });

    it('Rejeita texto acima do limite', async () => {
      await expect(createTask({ userId: 'u1', date: '2026-10-23', text: 'a'.repeat(MAX_TASK_TEXT + 1) }))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it.each([[undefined], [''], ['23/10/2026'], ['2026-13-01'], ['2026-02-30'], [20261023]])(
      'Rejeita data inválida (%p)', async (date) => {
        await expect(createTask({ userId: 'u1', date, text: 'a' }))
          .rejects.toBeInstanceOf(ValidationError);
        expect(repo.createTaskDb).not.toHaveBeenCalled();
      });
  });

  describe('listTasks', () => {
    it('Lista as tarefas do usuário', async () => {
      repo.getTasksByUserDb.mockResolvedValue([OWN]);

      expect(await listTasks('u1')).toEqual([OWN]);
      expect(repo.getTasksByUserDb).toHaveBeenCalledWith('u1');
    });
  });

  describe('updateTask', () => {
    it('Atualiza texto e data e renova updatedAt', async () => {
      await updateTask({ userId: 'u1', taskId: 't1', text: ' Novo ', date: '2026-11-01', now: NOW });

      expect(repo.updateTaskDb).toHaveBeenCalledWith('t1', {
        text: 'Novo', date: '2026-11-01', updatedAt: NOW.toISOString()
      });
    });

    it('Exige texto ou data e valida o que veio', async () => {
      await expect(updateTask({ userId: 'u1', taskId: 't1' })).rejects.toBeInstanceOf(ValidationError);
      await expect(updateTask({ userId: 'u1', taskId: 't1', text: ' ' })).rejects.toBeInstanceOf(ValidationError);
      await expect(updateTask({ userId: 'u1', taskId: 't1', date: 'x' })).rejects.toBeInstanceOf(ValidationError);
      expect(repo.updateTaskDb).not.toHaveBeenCalled();
    });

    it('404 para tarefa alheia ou inexistente', async () => {
      repo.getTaskByIdDb.mockResolvedValueOnce(OTHERS);
      await expect(updateTask({ userId: 'u1', taskId: 't2', text: 'x' })).rejects.toBeInstanceOf(NotFoundError);

      repo.getTaskByIdDb.mockResolvedValueOnce(null);
      await expect(updateTask({ userId: 'u1', taskId: 'x', text: 'x' })).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.updateTaskDb).not.toHaveBeenCalled();
    });
  });

  describe('setTaskCompleted', () => {
    it('Conclui sem apagar e grava completedAt', async () => {
      await setTaskCompleted({ userId: 'u1', taskId: 't1', now: NOW });

      expect(repo.updateTaskDb).toHaveBeenCalledWith('t1', {
        completed: true, completedAt: NOW.toISOString(), updatedAt: NOW.toISOString()
      });
      expect(repo.deleteTaskDb).not.toHaveBeenCalled();
    });

    it('Reabre com completed false e completedAt null', async () => {
      await setTaskCompleted({ userId: 'u1', taskId: 't1', completed: false, now: NOW });

      expect(repo.updateTaskDb).toHaveBeenCalledWith('t1', {
        completed: false, completedAt: null, updatedAt: NOW.toISOString()
      });
    });

    it('Rejeita completed que não seja booleano', async () => {
      await expect(setTaskCompleted({ userId: 'u1', taskId: 't1', completed: 'sim' }))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('404 para tarefa alheia', async () => {
      repo.getTaskByIdDb.mockResolvedValue(OTHERS);

      await expect(setTaskCompleted({ userId: 'u1', taskId: 't2' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('deleteTask', () => {
    it('Exclui a própria e recusa a alheia', async () => {
      await deleteTask({ userId: 'u1', taskId: 't1' });
      expect(repo.deleteTaskDb).toHaveBeenCalledWith('t1');

      repo.getTaskByIdDb.mockResolvedValueOnce(OTHERS);
      await expect(deleteTask({ userId: 'u1', taskId: 't2' })).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.deleteTaskDb).toHaveBeenCalledTimes(1);
    });
  });
});