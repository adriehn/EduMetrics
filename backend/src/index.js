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

// OBLIGATORIO en Vercel/Render para que express-rate-limit lea la IP real del cliente y no la del proxy de Vercel
app.set('trust proxy', 1);

// Orígenes permitidos (tu local y la URL que te dé Vercel para el front)
const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como Postman o cURL) o desde dominios permitidos
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Demasiados intentos desde esta IP, por favor intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/carreras', carrerasRoutes);
app.use('/api/consultas', consultasRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', app: 'EduMetrics' });
});

// En local levanta el puerto; en Vercel se encarga la plataforma
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`EduMetrics backend corriendo en http://localhost:${PORT}`);
  });
}

// OBLIGATORIO para Vercel
export default app;