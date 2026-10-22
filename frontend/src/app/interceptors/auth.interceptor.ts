import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const esApiPropia = req.url.startsWith(environment.apiUrl);
  const esRutaPublicaAuth = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  let reqAEnviar = req;

  // Solo inyectamos el token si la petición va hacia nuestro propio backend y no es login/register
  if (esApiPropia && !esRutaPublicaAuth) {
    const token = authService.getToken();
    if (token) {
      reqAEnviar = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(reqAEnviar).pipe(
    catchError((error: HttpErrorResponse) => {
      if (esApiPropia && (error.status === 401 || error.status === 403) && !router.url.includes('/login')) {
        console.warn('Sesión expirada o token inválido. Ejecutando logout...');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};