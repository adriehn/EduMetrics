import { Router } from 'express';
import { getConsultas, createConsulta, getCanales, updateEstadoConsulta } from '../controllers/consultas.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', getConsultas);
router.post('/', createConsulta);
router.get('/canales', getCanales);
router.patch('/:id/estado', updateEstadoConsulta);

export default router;