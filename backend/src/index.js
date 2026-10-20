import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import carrerasRoutes from './routes/carreras.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/carreras', carrerasRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', app: 'EduMetrics' });
});

app.listen(PORT, () => {
  console.log(`EduMetrics backend corriendo en http://localhost:${PORT}`);
});