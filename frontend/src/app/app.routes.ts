import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./components/admin/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'user',
    loadChildren: () =>
      import('./components/user/user.module')
        .then(m => m.UserModule)
  },
  { path: '', redirectTo: '/user', pathMatch: 'full' },
  { path: '**', redirectTo: '/user' }
];
