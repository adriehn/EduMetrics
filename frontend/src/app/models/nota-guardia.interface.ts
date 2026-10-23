export type PrioridadNota = 'baja' | 'media' | 'alta';

export interface NotaGuardia {
  id: string;
  institucion_id: string;
  consulta_id?: string | null;
  titulo: string;
  contenido: string;
  prioridad?: PrioridadNota;
  creado_en: string;
}
