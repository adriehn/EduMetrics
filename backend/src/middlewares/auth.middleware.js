import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
      }

      req.institucion_id = decoded.institucion_id;
      req.institucion_nombre = decoded.nombre;

      next();
    });
} catch (error) {
    console.error('Error en verificarToken:', error);
    return res.status(500).json({ error: 'Error interno al procesar la autenticación' });
  }
};
