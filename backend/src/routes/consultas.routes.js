import { Router } from 'express';
import { getConsultas, createConsulta, getCanales } from '../controllers/consultas.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', getConsultas);
router.post('/', createConsulta);
router.get('/canales', getCanales);

export default router;