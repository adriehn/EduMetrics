import { supabase } from '../config/supabase.js';

// 1. Obtener todas las carreras de la institución autenticada
export const getCarreras = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const soloActivas = req.query.activo !== 'false';

    const { data, error } = await supabase
      .from('carreras')
      .select('id, institucion_id, nombre, codigo, duracion_anios, activo, creado_en')
      .eq('institucion_id', institucion_id)
      .eq('activo', soloActivas)
      .order('nombre', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en getCarreras:', error);
    return res.status(500).json({ error: 'Error al obtener las carreras' });
  }
};

// 2. Alternar estado activo / inactivo (Soft delete y reactivación)
export const toggleEstadoCarrera = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El campo activo debe ser un booleano' });
    }

    const { data, error } = await supabase
      .from('carreras')
      .update({ activo })
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select('id, institucion_id, nombre, codigo, duracion_anios, activo, creado_en')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en toggleEstadoCarrera:', error);
    return res.status(500).json({ error: 'Error al actualizar el estado de la carrera' });
  }
};

// 3. Crear una nueva carrera
export const createCarrera = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { nombre, codigo, duracion_anios } = req.body;

    if (typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la carrera es obligatorio' });
    }

    const duracionParsed = (duracion_anios !== undefined && duracion_anios !== null && duracion_anios !== '')
      ? parseInt(duracion_anios, 10)
      : null;

    if (duracionParsed !== null && (isNaN(duracionParsed) || duracionParsed < 1 || duracionParsed > 15)) {
      return res.status(400).json({ error: 'La duración en años debe ser un número válido entre 1 y 15' });
    }

    const nuevaCarrera = {
      institucion_id,
      nombre: nombre.trim(),
      codigo: typeof codigo === 'string' && codigo.trim() ? codigo.trim() : null,
      duracion_anios: duracionParsed,
      activo: true
    };

    const { data, error } = await supabase
      .from('carreras')
      .insert([nuevaCarrera])
      .select('id, institucion_id, nombre, codigo, duracion_anios, activo, creado_en')
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error en createCarrera:', error);
    return res.status(500).json({ error: 'Error al crear la carrera' });
  }
};

// 4. Actualizar datos de una carrera
export const updateCarrera = async (req, res) => {
  try {
    const { id } = req.params;
    const institucion_id = req.institucion_id;
    const { nombre, codigo, duracion_anios } = req.body;

    if (typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la carrera es obligatorio' });
    }

    const duracionParsed = (duracion_anios !== null && duracion_anios !== undefined && duracion_anios !== '')
      ? Number(duracion_anios)
      : null;

    if (duracionParsed !== null && (isNaN(duracionParsed) || duracionParsed < 1 || duracionParsed > 15)) {
      return res.status(400).json({ error: 'La duración en años debe ser un número válido entre 1 y 15' });
    }

    const { data, error } = await supabase
      .from('carreras')
      .update({
        nombre: nombre.trim(),
        codigo: typeof codigo === 'string' && codigo.trim() ? codigo.trim() : null,
        duracion_anios: duracionParsed
      })
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select('id, institucion_id, nombre, codigo, duracion_anios, activo, creado_en')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    return res.status(200).json({
      message: 'Carrera actualizada exitosamente',
      carrera: data
    });
  } catch (error) {
    console.error('Error en updateCarrera:', error);
    return res.status(500).json({ error: 'Error al actualizar la carrera' });
  }
};