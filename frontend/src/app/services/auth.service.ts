import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Institucion, AuthResponse, LoginDTO, RegisterDTO } from '../models';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly TOKEN_KEY = 'edumetrics_token';
  private readonly USER_KEY = 'edumetrics_user';

  currentUser = signal<Institucion | null>(this.getUserFromStorage());

  //private readonly BACKEND_URL = 'https://edumetrics-sooty.vercel.app'; // URL fija temporal

  register(data: { nombre: string; email: string; password: string }) {
    return this.http.post(`${environment.apiUrl}/auth/register`, data);
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        if (this.isBrowser) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.institucion));
        }
        this.currentUser.set(res.institucion);
      })
    );
  }
  logout() {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decodificamos la parte central (payload) del JWT para verificar que tenga formato válido y no haya expirado
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;

      const payload = JSON.parse(atob(payloadBase64));
      const ahoraEnSegundos = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < ahoraEnSegundos) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      // Si el token fue adulterado o tiene formato inválido, limpiamos sesión
      this.logout();
      return false;
    }
  }

  private getUserFromStorage(): Institucion | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }
  actualizarUsuario(usuario: Institucion) {
    if (this.isBrowser) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    }
    this.currentUser.set(usuario);
  }
}
