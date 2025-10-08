import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si NO hay sesión, deja entrar al login
  if (!auth.isLoggedIn()) return true;

  const user = auth.getCurrentUser();
  // Si hay sesión, redirige según rol
  if (user?.rol === 'admin') {
    return router.createUrlTree(['/admin']);
  }
  return router.createUrlTree(['/user/menu']);
};
