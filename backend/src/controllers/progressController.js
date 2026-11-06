import * as progressService from '../services/progressService.js';
import { handleError } from '../errors/handleError.js';

export async function getProgress(req, res) {
  try {
    const { xp, subjects } = await progressService.getProgress(req.user.uid);
    return res.status(200).json({ success: true, xp, subjects });
  } catch (error) {
    return handleError(res, error);
  }
}