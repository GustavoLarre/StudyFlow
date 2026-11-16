import { Router } from 'express';
import { checkUsernameAvailability } from '../services/usernameService.js';
import { handleError } from '../errors/handleError.js';

const router = Router();

router.get('/:name/available', async (req, res) => {
  try {
    const result = await checkUsernameAvailability(req.user.uid, req.params.name);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;