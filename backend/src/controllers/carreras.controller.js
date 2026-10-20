import { supabase } from '../config/supabase.js';

// 1. Ver Carreras de la institución logueada
export const getCarreras = async (req, res) => {
  try {
    const institucion_id = req.institucion_id; // Inyectado por el middleware

    const { data, error } = await supabase
      .from('carreras')
      .select('id, nombre, codigo, creado_en')
      .eq('institucion_id', institucion_id)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Crear Carrera vinculada a la institución
export const createCarrera = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { nombre, codigo } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la carrera es obligatorio' });
    }

    const { data, error } = await supabase
      .from('carreras')
      .insert([
        {
          institucion_id,
          nombre: nombre.trim(),
          codigo: codigo ? codigo.trim() : null
        }
      ])
      .select('id, nombre, codigo, creado_en')
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: 'Carrera creada exitosamente',
      carrera: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};