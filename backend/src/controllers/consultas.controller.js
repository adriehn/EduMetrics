import { supabase } from '../config/supabase.js';

const ESTADOS_VALIDOS = ['pendiente', 'contactado', 'inscripto', 'descartado'];

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
    console.error('Error en getConsultas:', error);
    return res.status(500).json({ error: 'Error al obtener las consultas' });
  }
};

// 2. Registrar una nueva consulta
export const createConsulta = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { nombre_interesado, carrera_id, canal, telefono, email, notas, estado } = req.body;

    if (typeof nombre_interesado !== 'string' || !nombre_interesado.trim()) {
      return res.status(400).json({ error: 'El nombre del interesado es obligatorio' });
    }

    if (!carrera_id || typeof carrera_id !== 'string') {
      return res.status(400).json({ error: 'La carrera es obligatoria' });
    }

    if (!canal || typeof canal !== 'string') {
      return res.status(400).json({ error: 'El canal es obligatorio' });
    }

    const estadoFinal = estado || 'pendiente';
    if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
      return res.status(400).json({ error: 'Estado de consulta no válido' });
    }

    // SEGURIDAD: Verificar que la carrera exista y pertenezca a la institución autenticada
    const { data: carreraValida, error: errorCarrera } = await supabase
      .from('carreras')
      .select('id')
      .eq('id', carrera_id)
      .eq('institucion_id', institucion_id)
      .maybeSingle();

    if (errorCarrera || !carreraValida) {
      return res.status(403).json({ error: 'La carrera seleccionada no es válida o no pertenece a tu institución' });
    }

    const nuevaConsulta = {
      institucion_id,
      carrera_id,
      nombre_interesado: nombre_interesado.trim(),
      canal: canal.trim(),
      telefono: typeof telefono === 'string' && telefono.trim() ? telefono.trim() : null,
      email: typeof email === 'string' && email.trim() ? email.trim() : null,
      notas: typeof notas === 'string' && notas.trim() ? notas.trim() : null,
      estado: estadoFinal
    };

    const { data, error } = await supabase
      .from('consultas')
      .insert([nuevaConsulta])
      .select('id, codigo_ticket, institucion_id, carrera_id, nombre_interesado, email, telefono, canal, estado, notas, creado_en, carreras(nombre, codigo)')
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error en createConsulta:', error);
    return res.status(500).json({ error: 'Error al registrar la consulta' });
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
    console.error('Error en getCanales:', error);
    return res.status(500).json({ error: 'Error al obtener los canales de consulta' });
  }
};

// 4. Actualizar el estado de una consulta
export const updateEstadoConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const institucion_id = req.institucion_id;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const { data, error } = await supabase
      .from('consultas')
      .update({ estado })
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en updateEstadoConsulta:', error);
    return res.status(500).json({ error: 'Error al actualizar el estado de la consulta' });
  }
};

// 5. Obtener consultas pendientes (hoja de notas de turnos)
export const getNotasPendientes = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { busqueda } = req.query;

    let query = supabase
      .from('consultas')
      .select('id, codigo_ticket, nombre_interesado, telefono, email, canal, notas, estado, creado_en, carreras(nombre)')
      .eq('institucion_id', institucion_id)
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: false });

    if (typeof busqueda === 'string' && busqueda.trim()) {
      // Sanitizamos caracteres de control de PostgREST (comas y paréntesis) para evitar inyección en .or()
      const cleanBusqueda = busqueda.trim().replace(/[,()]/g, '');
      if (cleanBusqueda) {
        const term = `%${cleanBusqueda}%`;
        query = query.or(`codigo_ticket.ilike.${term},nombre_interesado.ilike.${term}`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en getNotasPendientes:', error);
    return res.status(500).json({ error: 'Error al obtener las notas pendientes' });
  }
};

// 6. Actualizar observación o marcar como resuelta
export const resolverConsulta = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;
    const { id } = req.params;
    const { estado, notas } = req.body;

    const payload = {};
    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }
      payload.estado = estado;
    }

    if (notas !== undefined) {
      payload.notas = typeof notas === 'string' ? notas.trim() : null;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No se enviaron datos para actualizar' });
    }

    const { data, error } = await supabase
      .from('consultas')
      .update(payload)
      .eq('id', id)
      .eq('institucion_id', institucion_id)
      .select('id, codigo_ticket, nombre_interesado, telefono, email, canal, notas, estado, carreras(nombre)')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en resolverConsulta:', error);
    return res.status(500).json({ error: 'Error al actualizar la consulta' });
  }
};