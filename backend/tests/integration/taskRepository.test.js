import {
  createTaskDb, getTasksByUserDb, getTaskByIdDb, updateTaskDb, deleteTaskDb
} from '../../src/repositories/taskRepository.js';
import { clearAll } from '../helpers/emulator.js';

describe('Repositório de Tarefas - Firestore', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('Cria uma tarefa e devolve o taskId', async () => {
    const result = await createTaskDb({ userId: 'u1', date: '2026-10-23', text: 'Estudar', completed: false });

    expect(result).toHaveProperty('taskId');
    expect(result).toMatchObject({ userId: 'u1', text: 'Estudar' });
  });

  it('Lista só as tarefas do usuário, pendentes e concluídas', async () => {
    await createTaskDb({ userId: 'u1', date: '2026-10-23', text: 'a', completed: false });
    await createTaskDb({ userId: 'u1', date: '2026-10-24', text: 'b', completed: true });
    await createTaskDb({ userId: 'u2', date: '2026-10-23', text: 'c', completed: false });

    const tasks = await getTasksByUserDb('u1');

    expect(tasks.map((t) => t.text).sort()).toEqual(['a', 'b']);
  });

  it('Busca por ID e devolve null se não existir', async () => {
    const created = await createTaskDb({ userId: 'u1', date: '2026-10-23', text: 'a', completed: false });

    expect(await getTaskByIdDb(created.taskId)).toMatchObject({ taskId: created.taskId, text: 'a' });
    expect(await getTaskByIdDb('fantasma')).toBeNull();
  });

  it('Atualiza campos e devolve a tarefa; falha se não existir', async () => {
    const created = await createTaskDb({ userId: 'u1', date: '2026-10-23', text: 'a', completed: false });

    const updated = await updateTaskDb(created.taskId, { completed: true });

    expect(updated).toMatchObject({ completed: true, text: 'a' });
    await expect(updateTaskDb('fantasma', { text: 'x' })).rejects.toThrow();
  });

  it('Exclui a tarefa e não falha se ela não existir', async () => {
    const created = await createTaskDb({ userId: 'u1', date: '2026-10-23', text: 'a', completed: false });

    await deleteTaskDb(created.taskId);

    expect(await getTaskByIdDb(created.taskId)).toBeNull();
    await expect(deleteTaskDb('fantasma')).resolves.not.toThrow();
  });
});