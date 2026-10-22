import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Ignorar endpoints públicos de autenticación
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  // 2. Obtener el token directamente desde AuthService (usa 'edumetrics_token')
  const token = authService.getToken();

  let reqAEnviar = req;
  if (token) {
    reqAEnviar = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(reqAEnviar).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend responde 401 o 403 y no estamos en la pantalla de login
      if ((error.status === 401 || error.status === 403) && !router.url.includes('/login')) {
        console.warn('Sesión expirada o token inválido. Ejecutando logout...');
        authService.logout(); // Limpia 'edumetrics_token', 'edumetrics_user' y redirige a /login
      }
      return throwError(() => error);
    })
  );
};