import { supabase } from '../config/supabase.js';

// 1. Obtener todas las carreras de la institución autenticada
export const getCarreras = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    // Si viene req.query.activo como "false", es false; caso contrario, true
    const soloActivas = req.query.activo !== 'false';

    const { data, error } = await supabase
      .from('carreras')
      .select('id, institucion_id, nombre, codigo, duracion_anios, activo, creado_en')
      .eq('institucion_id', institucion_id)
      .eq('activo', soloActivas) // <-- Acá usamos soloActivas en lugar del booleano estático
      .order('nombre', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en getCarreras:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// 2. Alternar estado activo / inactivo (Soft delete y reactivación)
export const toggleEstadoCarrera = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { id } = req.params;
    const { activo } = req.body;

    console.log('--- TOGGLE ESTADO CARRERA ---');
    console.log(`ID: ${id}, institucion_id: ${institucion_id}, nuevo activo:`, activo);

    const nuevoEstado = Boolean(activo);

    const { data, error } = await supabase
      .from('carreras')
      .update({ activo: nuevoEstado })
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select('id, institucion_id, nombre, codigo, duracion_anios, activo, creado_en')
      .single();

    if (error) {
      console.error('Error Supabase update:', error);
      throw error;
    }

    console.log('Carrera actualizada en Supabase:', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en toggleEstadoCarrera:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// 3. Crear una nueva carrera
export const createCarrera = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { nombre, codigo, duracion_anios } = req.body;

    console.log('--- REQ BODY RECIBIDO ---', req.body);

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la carrera es obligatorio' });
    }

    const duracionParsed = (duracion_anios !== undefined && duracion_anios !== null && duracion_anios !== '')
      ? parseInt(duracion_anios, 10)
      : null;

    const nuevaCarrera = {
      institucion_id,
      nombre: nombre.trim(),
      codigo: codigo ? codigo.trim() : null,
      duracion_anios: duracionParsed,
      activo: true // Aseguramos que nazca activa
    };

    console.log('--- INSERTANDO EN SUPABASE ---', nuevaCarrera);

    const { data, error } = await supabase
      .from('carreras')
      .insert([nuevaCarrera])
      .select('id, institucion_id, nombre, codigo, duracion_anios, activo, creado_en')
      .single();

    if (error) {
      console.error('Error de Supabase al insertar:', error);
      throw error;
    }

    console.log('--- CARRERA CREADA CON ÉXITO ---', data);
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error en createCarrera:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const updateCarrera = async (req, res) => {
  try {
    const { id } = req.params;
    const institucion_id = req.institucion_id;
    const { nombre, codigo, duracion_anios } = req.body; // <-- Cambiado a duracion_anios

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la carrera es obligatorio' });
    }

    const { data, error } = await supabase
      .from('carreras')
      .update({
        nombre: nombre.trim(),
        codigo: codigo ? codigo.trim() : null,
        duracion_anios: duracion_anios !== null && duracion_anios !== undefined && !isNaN(Number(duracion_anios)) 
          ? Number(duracion_anios) 
          : null // <-- Guarda en duracion_anios
      })
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: 'Carrera actualizada exitosamente',
      carrera: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};