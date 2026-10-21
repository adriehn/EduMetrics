import { Router } from 'express';
import { getCarreras, createCarrera, toggleEstadoCarrera } from '../controllers/carreras.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { updateCarrera } from '../controllers/carreras.controller.js';

const router = Router();

// Todas las rutas de este archivo pasan primero por el middleware de autenticación
router.use(verificarToken);
router.get('/', getCarreras);
router.post('/', createCarrera);
router.patch('/:id/estado', toggleEstadoCarrera);

router.put('/:id', updateCarrera);
export default router;