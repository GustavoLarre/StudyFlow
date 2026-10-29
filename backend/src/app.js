import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import subjectRoutes from './routes/subjectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'ok',
    message: 'StudyFlow API is running smoothly! 🟢'
  });
});

app.use('/subjects', subjectRoutes);
app.use('/', noteRoutes);
app.use('/', flashcardRoutes);
app.use('/tasks', taskRoutes);

app.use((req, res) => {
  return res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

export default app;