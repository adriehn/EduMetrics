import { supabase } from '../config/supabase.js';

// 1. Obtener todas las consultas de la institución logueada
export const getConsultas = async (req, res) => {
  try {
    const institucion_id = req.institucion_id;

    const { data, error } = await supabase
      .from('consultas')
      .select(`
        id,
        nombre_interesado,
        email_interesado,
        telefono_interesado,
        motivo,
        creado_en,
        carreras ( id, nombre, codigo ),
        canales_consulta ( id, nombre )
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
      canal_id,
      nombre_interesado,
      email_interesado,
      telefono_interesado,
      motivo
    } = req.body;

    if (!carrera_id || !canal_id) {
      return res.status(400).json({ error: 'La carrera y el canal de consulta son obligatorios' });
    }

    const { data, error } = await supabase
      .from('consultas')
      .insert([
        {
          institucion_id,
          carrera_id,
          canal_id,
          nombre_interesado: nombre_interesado ? nombre_interesado.trim() : null,
          email_interesado: email_interesado ? email_interesado.trim().toLowerCase() : null,
          telefono_interesado: telefono_interesado ? telefono_interesado.trim() : null,
          motivo: motivo ? motivo.trim() : null
        }
      ])
      .select()
      .single();

    if (error) throw error;

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