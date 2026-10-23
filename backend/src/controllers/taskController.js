import { createTaskDb, getTasksDb, completeAndDeleteTaskDb } from '../repositories/taskRepository.js';

export async function createTask(req, res) {
  try {
    const { date, text } = req.body;

    if (!date || !text) {
      return res.status(400).json({ error: 'Data (título) e texto da tarefa são obrigatórios.' });
    }

    const taskData = {
      date,
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };

    const newTask = await createTaskDb(taskData);
    return res.status(201).json(newTask);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return res.status(500).json({ error: 'Erro interno ao criar tarefa.' });
  }
}

export async function listTasks(req, res) {
  try {
    const tasks = await getTasksDb();
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    return res.status(500).json({ error: 'Erro interno ao listar tarefas.' });
  }
}

export async function completeTask(req, res) {
  try {
    const { taskId } = req.params;
    const success = await completeAndDeleteTaskDb(taskId);

    if (!success) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    return res.status(200).json({ message: 'Tarefa concluída e removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao concluir tarefa:', error);
    return res.status(500).json({ error: 'Erro interno ao concluir tarefa.' });
  }
}