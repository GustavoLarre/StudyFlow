import { Router } from 'express';
import * as profileService from '../services/profileService.js';
import { handleError } from '../errors/handleError.js';
import { getAuth } from 'firebase-admin/auth';
import { requireRecentLogin } from '../middlewares/recentLogin.js';
import { deleteAccount } from '../services/accountService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    return res.status(200).json({ success: true, user: await profileService.getProfile(req.user.uid) });
  } catch (error) {
    return handleError(res, error);
  }
});

router.put('/', async (req, res) => {
  try {
    const user = await profileService.updateProfile(req.user.uid, {
      username: req.body?.username,
      name: req.body?.name
    });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return handleError(res, error);
  }
});

router.delete('/', async (req, res) => {
  try {
    requireRecentLogin(req.auth);
    await deleteAccount(req.user.uid, {
      deleteAuthUser: (uid) => getAuth().deleteUser(uid)
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;