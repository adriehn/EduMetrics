import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Si está renderizando en el servidor (SSR), dejamos pasar para que el navegador evalúe localStorage al hidratar
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};