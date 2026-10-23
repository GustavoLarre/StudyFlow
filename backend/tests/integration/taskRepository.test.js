import { 
  createTaskDb, 
  getTasksDb, 
  completeAndDeleteTaskDb 
} from '../../src/repositories/taskRepository.js';

describe('Repositório de Tarefas - Firestore (CRUD & Auto-Delete)', () => {
  let createdTaskId;

  it('Deve criar uma tarefa com sucesso no Firestore', async () => {
    const taskData = {
      date: '2026-10-23',
      text: 'Revisar algoritmos de grafos e ponteiros',
      completed: false,
      createdAt: new Date().toISOString()
    };

    const result = await createTaskDb(taskData);

    expect(result).toHaveProperty('taskId');
    expect(result.text).toBe(taskData.text);
    expect(result.completed).toBe(false);

    createdTaskId = result.taskId;
  });

  it('Deve listar apenas as tarefas pendentes', async () => {
    const tasks = await getTasksDb();

    expect(Array.isArray(tasks)).toBe(true);
    const found = tasks.find(t => t.taskId === createdTaskId);
    expect(found).toBeDefined();
    expect(found.completed).toBe(false);
  });

  it('Deve concluir e apagar automaticamente a tarefa do Firestore', async () => {
    // Ação de concluir a tarefa aciona a exclusão automática
    const deleted = await completeAndDeleteTaskDb(createdTaskId);
    expect(deleted).toBe(true);

    // Verifica se ela sumiu de vez do Firestore
    const tasksAfter = await getTasksDb();
    const found = tasksAfter.find(t => t.taskId === createdTaskId);
    expect(found).toBeUndefined();
  });
});