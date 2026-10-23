import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

// 1. Obtener datos del perfil actual
export const getPerfil = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;

    const { data, error } = await supabase
      .from('instituciones')
      .select('id, nombre, email, avatar_url, creado_en')
      .eq('id', institucion_id)
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en getPerfil:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// 2. Actualizar datos básicos (Nombre, Email, Avatar)
export const updatePerfil = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { nombre, email, avatar_url } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'El correo electrónico es obligatorio.' });
    }

    const payload = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase()
    };
    if (avatar_url !== undefined) payload.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from('instituciones')
      .update(payload)
      .eq('id', institucion_id)
      .select('id, nombre, email, avatar_url')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El correo electrónico ya está en uso por otra institución.' });
      }
      throw error;
    }

    return res.status(200).json({
      message: 'Perfil actualizado con éxito.',
      institucion: data
    });
  } catch (error) {
    console.error('Error en updatePerfil:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// 3. Modificar contraseña
export const cambiarPassword = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { passwordActual, nuevaPassword } = req.body;

    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({ error: 'Debés proporcionar la contraseña actual y la nueva.' });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    // 1. Consultar la columna real: password_hash
    const { data: inst, error: fetchErr } = await supabase
      .from('instituciones')
      .select('id, password_hash')
      .eq('id', institucion_id)
      .single();

    if (fetchErr || !inst) {
      console.error('Error al consultar institución:', fetchErr);
      return res.status(404).json({ error: 'Institución no encontrada.' });
    }

    // 2. Comparar contra password_hash
    const esValida = await bcrypt.compare(passwordActual, inst.password_hash);
    if (!esValida) {
      return res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta.' });
    }

    // 3. Hashear y actualizar en password_hash
    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(nuevaPassword, salt);

    const { error: updateErr } = await supabase
      .from('instituciones')
      .update({ password_hash: nuevoHash })
      .eq('id', institucion_id);

    if (updateErr) throw updateErr;

    return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error en cambiarPassword:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// 4. Subir imagen de perfil a Supabase Storage
export const subirAvatar = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún archivo de imagen.' });
    }

    // Validar extensiones y tipos permitidos
    const extensionesValidas = ['image/jpeg', 'image/png', 'image/webp'];
    if (!extensionesValidas.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Formato no soportado. Subí una imagen JPG, PNG o WebP.' });
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${institucion_id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Subir buffer directo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Obtener la URL pública directa
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    // Guardar la URL en la base de datos
    await supabase
      .from('instituciones')
      .update({ avatar_url: avatarUrl })
      .eq('id', institucion_id);

    return res.status(200).json({
      message: 'Foto de perfil actualizada correctamente.',
      avatar_url: avatarUrl
    });
  } catch (error) {
    console.error('Error en subirAvatar:', error.message);
    return res.status(500).json({ error: error.message });
  }
};