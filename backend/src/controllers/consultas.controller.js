import { supabase } from '../config/supabase.js';

// 1. Obtener todas las consultas de la institución logueada
export const getConsultas = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;

    const { data, error } = await supabase
      .from('consultas')
      .select('id, codigo_ticket, institucion_id, carrera_id, nombre_interesado, email, telefono, canal, estado, notas, creado_en, carreras(nombre, codigo)')
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
    const { nombre_interesado, carrera_id, canal, telefono, email, notas, estado } = req.body;

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
      nombre_interesado: nombre_interesado.trim(),
      canal,
      telefono: telefono ? telefono.trim() : null,
      email: email ? email.trim() : null,
      notas: notas ? notas.trim() : null,
      estado: estado || 'pendiente' // Toma el estado del formulario o cae en pendiente
    };

    const { data, error } = await supabase
      .from('consultas')
      .insert([nuevaConsulta])
      .select('*, carreras(nombre, codigo)')
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error createConsulta:', error.message);
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
// Obtener consultas pendientes (hoja de notas de turnos)
export const getNotasPendientes = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { busqueda } = req.query; // Para buscar por código o nombre

    let query = supabase
      .from('consultas')
      .select('id, codigo_ticket, nombre_interesado, telefono, email, canal, notas, estado, creado_en, carreras(nombre)')
      .eq('institucion_id', institucion_id)
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: false });

    if (busqueda && busqueda.trim()) {
      const term = `%${busqueda.trim()}%`;
      query = query.or(`codigo_ticket.ilike.${term},nombre_interesado.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en getNotasPendientes:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Actualizar observación o marcar como resuelta
export const resolverConsulta = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { id } = req.params;
    const { estado, notas } = req.body;

    const payload = {};
    if (estado) payload.estado = estado; // 'contactado', 'inscripto', 'descartado'
    if (notas !== undefined) payload.notas = notas;

    const { data, error } = await supabase
      .from('consultas')
      .update(payload)
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select('id, codigo_ticket, nombre_interesado, telefono, email, canal, notas, estado, carreras(nombre)')
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en resolverConsulta:', error.message);
    return res.status(500).json({ error: error.message });
  }
};