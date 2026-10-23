import dotenv from 'dotenv';

// 1. Carrega as variáveis de ambiente (.env) bem no topo
dotenv.config();

// 2. Importação das rotas da aplicação
import express from 'express';
import subjectRoutes from './routes/subjectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

// 3. Middlewares globais
app.use(express.json());

// 4. Rota de Health Check (Sanity Check) - Ajustada com a propriedade 'status'
app.get('/health', (req, res) => {
  return res.status(200).json({ 
    success: true, 
    status: 'ok', 
    message: 'StudyFlow API is running smoothly! 🟢' 
  });
});

// 5. Registro das Rotas da API
app.use('/subjects', subjectRoutes);
app.use('/', noteRoutes);       // Contém rotas como /subjects/:subjectId/notes e /notes/:noteId/generate-flashcards
app.use('/', flashcardRoutes);  // Contém rotas como /notes/:noteId/flashcards, /flashcards/:id/review e /review/due
app.use('/tasks', taskRoutes);

// 6. Tratamento de rotas não encontradas (404)
app.use((req, res) => {
  return res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

export default app;