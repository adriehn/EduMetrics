import { Institucion } from './institucion.interface';

export interface AuthResponse {
  message: string;
  token: string;
  institucion: Institucion;
}

export interface RegisterDTO {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}
