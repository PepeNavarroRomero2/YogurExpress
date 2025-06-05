// frontend/src/app/app.routes.ts

import { Routes } from '@angular/router';

// IMPORTANTE: agregamos "export" para que otros archivos puedan importarlo
export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./components/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'user',
    loadChildren: () =>
      import('./components/user/user.module').then(m => m.UserModule)
  },
  // Por defecto arranca en la zona de usuario
  { path: '', redirectTo: '/user', pathMatch: 'full' },
  // Cualquier ruta no reconocida va a /user
  { path: '**', redirectTo: '/user' }
];
