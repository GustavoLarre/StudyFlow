import * as subjectService from '../services/subjectService.js';

export async function create(req, res) {
  try {
    const { title } = req.body;
    const subject = await subjectService.createSubject({ title });
    return res.status(201).json({ success: true, subject });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function list(req, res) {
  try {
    const subjects = await subjectService.getAllSubjects();
    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}