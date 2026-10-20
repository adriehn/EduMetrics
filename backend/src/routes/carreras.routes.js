import { Router } from 'express';
import { getCarreras, createCarrera } from '../controllers/carreras.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de este archivo pasan primero por el middleware de autenticación
router.use(verificarToken);

router.get('/', getCarreras);
router.post('/', createCarrera);

export default router;