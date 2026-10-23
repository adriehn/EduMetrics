// src/app/models/consulta.interface.ts

export type CanalConsulta = 'whatsapp' | 'web' | 'presencial' | 'correo' | string;
export type EstadoConsulta = 'pendiente' | 'contactado' | 'inscripto' | 'descartado' | string;

export interface ConsultaCarreraRelacion {
  id?: string;
  nombre: string;
  codigo?: string | null;
}

export interface Consulta {
  id: string;
  codigo_ticket?: string | null;
  institucion_id: string;
  carrera_id: string;
  nombre_interesado: string;
  email?: string | null;
  telefono?: string | null;
  canal: CanalConsulta;
  estado: EstadoConsulta;
  notas?: string | null;
  creado_en?: string;
  carreras?: ConsultaCarreraRelacion;
}

export interface CrearConsultaPayload {
  carrera_id: string;
  nombre_interesado: string;
  canal: CanalConsulta;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
}