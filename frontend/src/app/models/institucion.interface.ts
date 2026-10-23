export interface Institucion {
  id: string;
  nombre: string;
  email: string;
  avatar_url?: string | null;
  creado_en?: string;
}

// Alias para mantener compatibilidad con componentes que usan PerfilData
export type PerfilData = Institucion;

export interface ActualizarPerfilDTO {
  nombre: string;
  email: string;
}

export interface CambiarPasswordDTO {
  passwordActual: string;
  nuevaPassword: string;
}