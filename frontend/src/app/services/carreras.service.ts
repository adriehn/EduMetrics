import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Carrera, CarreraDTO } from '../models';


@Injectable({
    providedIn: 'root'
})
export class CarrerasService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/carreras`;

    carreras = signal<Carrera[]>([]);
    // Señal dedicada para selects y formularios en toda la app
    carrerasActivas = signal<Carrera[]>([]);
    isLoading = signal<boolean>(false);

    obtenerCarreras(activo: boolean = true) {
        this.isLoading.set(true);
        return this.http.get<Carrera[]>(`${this.apiUrl}?activo=${activo}`).pipe(
            tap({
                next: (data) => {
                    this.carreras.set(data);
                    if (activo) {
                        this.carrerasActivas.set(data);
                    }
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false)
            })
        );
    }

    // Método auxiliar directo para selectores
    cargarCarrerasParaSelect() {
        return this.http.get<Carrera[]>(`${this.apiUrl}?activo=true`).pipe(
            tap((data) => this.carrerasActivas.set(data))
        );
    }
    crearCarrera(carrera: { nombre: string; codigo?: string | null; duracion_anios?: number | null }) {
        return this.http.post<any>(this.apiUrl, carrera).pipe(
            tap((res) => {
                const nueva = res.carrera ? res.carrera : res;
                this.carreras.update((list) => [nueva, ...list]);
            })
        );
    }
    cambiarEstado(id: string, activo: boolean) {
        return this.http.patch<Carrera>(`${this.apiUrl}/${id}/estado`, { activo }).pipe(
            tap(() => {
                // La quitamos de la vista actual (pasa a la otra pestaña)
                this.carreras.update((list) => list.filter((c) => c.id !== id));
            })
        );
    }

    actualizarCarrera(id: string, payload: { nombre: string; codigo?: string | null; duracion_anios?: number | null }) {
        return this.http.put<{ message: string; carrera: Carrera }>(`${this.apiUrl}/${id}`, payload).pipe(
            tap((res) => {
                this.carreras.update((list) =>
                    list.map((c) => (c.id === id ? res.carrera : c))
                );
            })
        );
    }
}