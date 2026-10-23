import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import carrerasRoutes from './routes/carreras.routes.js';
import consultasRoutes from './routes/consultas.routes.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: Falta definir JWT_SECRET en las variables de entorno');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:4200',
  'https://edu-metrics-mu.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));

// Ruta de prueba general para verificar que Express responde
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EduMetrics API funcionando correctamente' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', app: 'EduMetrics' });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Demasiados intentos desde esta IP, por favor intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registramos las rutas con y sin el prefijo /api por seguridad ante el mapeo de Vercel
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/carreras', carrerasRoutes);
app.use('/api/consultas', consultasRoutes);

// Duplicamos sin /api por si Vercel intercepta el prefijo en las Serverless Functions
app.use('/auth', authLimiter, authRoutes);
app.use('/carreras', carrerasRoutes);
app.use('/consultas', consultasRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`EduMetrics backend corriendo en http://localhost:${PORT}`);
  });
}

export default app;