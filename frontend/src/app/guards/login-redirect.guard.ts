import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn() || auth.isTokenExpired()) {
    return true;
  }

  const user = auth.getCurrentUser();
  if (user?.rol === 'admin') {
    return router.createUrlTree(['/admin']);
  }
  return router.createUrlTree(['/user/menu']);
};
