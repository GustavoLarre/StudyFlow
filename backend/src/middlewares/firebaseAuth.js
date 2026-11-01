import { getAuth } from 'firebase-admin/auth';
import { createAuthenticate } from './authenticate.js';

export const authenticate = createAuthenticate({
  verifyToken: (token) => getAuth().verifyIdToken(token)
});