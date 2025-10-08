import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isLogged = auth.isLoggedIn();
  const user = auth.getCurrentUser();
  const isAdmin = user?.rol === 'admin';

  if (isLogged && isAdmin) return true;

  // Si no está logueado o no es admin: redirige a login
  return router.createUrlTree(['/user/login']);
};
