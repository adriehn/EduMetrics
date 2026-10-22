import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

// Registrarse (Crear cuenta de Institución Académica)
export const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar presencia y que sean estrictamente strings
    if (
      typeof nombre !== 'string' || !nombre.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password
    ) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios y deben ser texto válido' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const emailLimpio = email.trim().toLowerCase();

    // Verificar si el correo ya existe
    const { data: usuarioExistente } = await supabase
      .from('instituciones')
      .select('id')
      .eq('email', emailLimpio)
      .maybeSingle();

    if (usuarioExistente) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar en la base de datos
    const { data: nuevaInstitucion, error } = await supabase
      .from('instituciones')
      .insert([
        {
          nombre: nombre.trim(),
          email: emailLimpio,
          password_hash
        }
      ])
      .select('id, nombre, email')
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: 'Institución registrada con éxito',
      institucion: nuevaInstitucion
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar la institución' });
  }
};

// Iniciar Sesión
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar institución
    const { data: institucion, error } = await supabase
      .from('instituciones')
      .select('id, nombre, email, password_hash')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !institucion) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar contraseña con el hash
    const passwordValido = await bcrypt.compare(password, institucion.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Firmar Token con el id de la institución adentro
    const token = jwt.sign(
      { institucion_id: institucion.id, nombre: institucion.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      institucion: {
        id: institucion.id,
        nombre: institucion.nombre,
        email: institucion.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};