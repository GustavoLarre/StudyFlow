import * as taskService from '../services/taskService.js';
import { handleError } from '../errors/handleError.js';

export async function create(req, res) {
  try {
    const task = await taskService.createTask({
      userId: req.user.uid,
      date: req.body?.date,
      text: req.body?.text
    });
    return res.status(201).json({ success: true, task });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function list(req, res) {
  try {
    const tasks = await taskService.listTasks(req.user.uid);
    return res.status(200).json({ success: true, tasks });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req, res) {
  try {
    const task = await taskService.updateTask({
      userId: req.user.uid,
      taskId: req.params.id,
      date: req.body?.date,
      text: req.body?.text
    });
    return res.status(200).json({ success: true, task });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function complete(req, res) {
  try {
    const task = await taskService.setTaskCompleted({
      userId: req.user.uid,
      taskId: req.params.id,
      completed: req.body?.completed
    });
    return res.status(200).json({ success: true, task });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req, res) {
  try {
    await taskService.deleteTask({ userId: req.user.uid, taskId: req.params.id });
    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}