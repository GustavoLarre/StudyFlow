import * as subjectService from '../services/subjectService.js';
import { handleError } from '../errors/handleError.js';

export async function create(req, res) {
  try {
    const subject = await subjectService.createSubject({
      userId: req.user.uid,
      title: req.body?.title
    });
    return res.status(201).json({ success: true, subject });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function list(req, res) {
  try {
    const subjects = await subjectService.getAllSubjects(req.user.uid);
    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function get(req, res) {
  try {
    const subject = await subjectService.getSubject({
      userId: req.user.uid,
      subjectId: req.params.id
    });
    return res.status(200).json({ success: true, subject });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req, res) {
  try {
    const subject = await subjectService.updateSubject({
      userId: req.user.uid,
      subjectId: req.params.id,
      title: req.body?.title
    });
    return res.status(200).json({ success: true, subject });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req, res) {
  try {
    const deleted = await subjectService.deleteSubject({
      userId: req.user.uid,
      subjectId: req.params.id
    });
    return res.status(200).json({ success: true, deleted });
  } catch (error) {
    return handleError(res, error);
  }
}