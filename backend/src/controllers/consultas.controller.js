import { supabase } from '../config/supabase.js';

// 1. Obtener todas las consultas de la institución logueada
export const getConsultas = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;

    const { data, error } = await supabase
      .from('consultas')
      .select(`
        id,
        institucion_id,
        carrera_id,
        nombre_interesado,
        canal,
        telefono,
        email,
        notas,
        estado,
        creado_en,
        carreras ( id, nombre, codigo )
      `)
      .eq('institucion_id', institucion_id)
      .order('creado_en', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Registrar una nueva consulta
export const createConsulta = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const {
      carrera_id,
      canal,
      nombre_interesado,
      email,
      telefono,
      notas
    } = req.body;

    if (!nombre_interesado || !nombre_interesado.trim()) {
      return res.status(400).json({ error: 'El nombre del interesado es obligatorio' });
    }
    if (!carrera_id) {
      return res.status(400).json({ error: 'La carrera es obligatoria' });
    }
    if (!canal) {
      return res.status(400).json({ error: 'El canal es obligatorio' });
    }

    const nuevaConsulta = {
      institucion_id,
      carrera_id,
      canal,
      nombre_interesado: nombre_interesado.trim(),
      telefono: telefono ? telefono.trim() : null,
      email: email ? email.trim() : null,
      notas: notas ? notas.trim() : null,
      estado: 'pendiente'
    };

    const { data, error } = await supabase
      .from('consultas')
      .insert([nuevaConsulta])
      .select(`
        id,
        institucion_id,
        carrera_id,
        nombre_interesado,
        canal,
        telefono,
        email,
        notas,
        estado,
        creado_en,
        carreras ( id, nombre, codigo )
      `)
      .single();

    if (error) {
      console.error('Error Supabase insert consulta:', error);
      throw error;
    }

    return res.status(201).json({
      message: 'Consulta registrada exitosamente',
      consulta: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

};
// 3. Obtener canales de consulta disponibles
export const getCanales = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('canales_consulta')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
export const updateEstadoConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const institucion_id = req.institucion_id;

    const { data, error } = await supabase
      .from('consultas')
      .update({ estado })
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};