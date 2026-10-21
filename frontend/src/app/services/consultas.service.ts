import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Consulta {
  id: string;
  codigo_ticket?: string | null;
  institucion_id: string;
  carrera_id: string;
  nombre_interesado: string;
  email?: string | null;
  telefono?: string | null;
  canal: 'whatsapp' | 'web' | 'presencial' | 'correo' | string;
  estado: 'pendiente' | 'contactado' | 'inscripto' | 'descartado' | string;
  notas?: string | null;
  creado_en?: string;
  carreras?: {
    id?: string;
    nombre: string;
    codigo?: string | null;
  };
}

export interface CrearConsultaPayload {
  carrera_id: string;
  nombre_interesado: string;
  canal: string;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/consultas`;

  consultas = signal<Consulta[]>([]);
  isLoading = signal<boolean>(false);

  obtenerConsultas() {
    this.isLoading.set(true);
    return this.http.get<Consulta[]>(this.apiUrl).pipe(
      tap({
        next: (data) => {
          this.consultas.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  crearConsulta(payload: CrearConsultaPayload) {
    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((res) => {
        const nueva: Consulta = res.consulta ? res.consulta : res;
        this.consultas.update((list) => [nueva, ...list]);
      })
    );
  }

  cambiarEstado(id: string, nuevoEstado: string) {
    return this.http.patch<Consulta>(`${this.apiUrl}/${id}/estado`, { estado: nuevoEstado }).pipe(
      tap((actualizada) => {
        this.consultas.update((list) =>
          list.map((c) => (c.id === id ? { ...c, estado: actualizada.estado } : c))
        );
      })
    );
  }

  obtenerNotasPendientes(busqueda: string = '') {
    const url = busqueda.trim()
      ? `${this.apiUrl}/notas?busqueda=${encodeURIComponent(busqueda.trim())}`
      : `${this.apiUrl}/notas`;
    return this.http.get<Consulta[]>(url);
  }

  actualizarResolucion(id: string, payload: { estado?: string; notas?: string }) {
    return this.http.patch<Consulta>(`${this.apiUrl}/${id}/resolver`, payload);
  }
}