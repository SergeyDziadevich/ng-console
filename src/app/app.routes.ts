import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/user-management/user-management').then(
        (m) => m.UserManagement
      ),
  },
  {
    path: 'user-management',
    loadComponent: () =>
      import('./components/user-management/user-management').then(
        (m) => m.UserManagement
      ),
  },
  {
    path: '',
    redirectTo: 'user-management',
    pathMatch: 'full',
  },
];
