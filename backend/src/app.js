import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import { authenticate } from './middlewares/firebaseAuth.js';
import subjectRoutes from './routes/subjectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import meRoutes from './routes/meRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import cors from 'cors';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Público
app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'ok',
    message: 'StudyFlow API is running smoothly! 🟢'
  });
});

// Tudo abaixo exige autenticação
app.use(authenticate);

app.use('/me', meRoutes);
app.use('/subjects', subjectRoutes);
app.use('/', noteRoutes);
app.use('/', flashcardRoutes);
app.use('/', reviewRoutes);
app.use('/tasks', taskRoutes);
app.use('/progress', progressRoutes);

app.use((req, res) => {
  return res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

export default app;