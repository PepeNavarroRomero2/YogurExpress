import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'user',
    loadChildren: () =>
      import('./components/user/user.module').then(m => m.UserModule)
  },
  { path: '', redirectTo: '/user', pathMatch: 'full' },
  { path: '**', redirectTo: '/user' }
];
