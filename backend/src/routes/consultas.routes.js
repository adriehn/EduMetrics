import { Router } from 'express';
import { getConsultas, createConsulta, getCanales, updateEstadoConsulta, getNotasPendientes, resolverConsulta } from '../controllers/consultas.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
const router = Router();

router.use(verificarToken);

router.get('/', getConsultas);
router.post('/', createConsulta);
router.get('/canales', getCanales);
router.patch('/:id/estado', updateEstadoConsulta);
router.get('/notas', getNotasPendientes);
router.patch('/:id/resolver', resolverConsulta);
export default router;