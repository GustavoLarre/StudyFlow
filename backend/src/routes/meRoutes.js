import { Router } from 'express';
import { authenticate } from '../middlewares/firebaseAuth.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

export default router;