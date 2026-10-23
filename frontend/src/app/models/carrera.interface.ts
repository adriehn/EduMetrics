// src/app/models/carrera.interface.ts

export interface Carrera {
  id: string;
  institucion_id?: string;
  nombre: string;
  codigo?: string | null;         
  duracion_anios?: number | null;
  activo?: boolean;
  creado_en?: string;
}

export interface CarreraDTO {
  nombre: string;
  codigo?: string | null;      
  duracion_anios?: number | null;
  activo?: boolean;
}