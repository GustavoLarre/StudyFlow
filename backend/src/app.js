import express from 'express';
import notesRouter from './routes/notesRoutes.js';

const app = express();

app.use(express.json());

// Rota de Health Check (Sanity Check)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running successfully' });
});

// Registrando as rotas de notas
app.use('/notes', notesRouter);

export default app;