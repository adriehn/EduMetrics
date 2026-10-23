import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PerfilData } from '../models'; 

@Injectable({
    providedIn: 'root'
})
export class PerfilService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/perfil`;

    obtenerPerfil() {
        return this.http.get<PerfilData>(this.apiUrl);
    }

    actualizarDatos(datos: { nombre: string; email: string }) {
        return this.http.put<{ message: string; institucion: PerfilData }>(this.apiUrl, datos);
    }

    cambiarPassword(passwords: { passwordActual: string; nuevaPassword: string }) {
        return this.http.patch<{ message: string }>(`${this.apiUrl}/password`, passwords);
    }

    subirAvatar(archivo: File) {
        const formData = new FormData();
        formData.append('avatar', archivo);
        return this.http.post<{ message: string; avatar_url: string }>(`${this.apiUrl}/avatar`, formData);
    }
}