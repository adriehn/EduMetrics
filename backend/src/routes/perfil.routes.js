// backend/src/routes/perfil.routes.js
import { Router } from 'express';
import multer from 'multer';
import { getPerfil, updatePerfil, cambiarPassword, subirAvatar } from '../controllers/perfil.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }
});

const router = Router();

// Aplica autenticación a todo lo que pase por /perfil
router.use(verificarToken);

router.get('/', getPerfil);
router.put('/', updatePerfil);
router.patch('/password', cambiarPassword); // <-- Solo '/password'
router.post('/avatar', upload.single('avatar'), subirAvatar);

export default router;