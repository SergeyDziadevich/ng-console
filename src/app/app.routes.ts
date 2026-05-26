import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'user-management',
    loadComponent: () =>
      import('./components/user-management/user-management').then((m) => m.UserManagement),
    children: [
      {
        path: 'add-user',
        loadComponent: () =>
          import('./components/user-management/add-user/add-user').then((m) => m.AddUser),
      },
      {
        path: 'edit-user/:id',
        loadComponent: () =>
          import('./components/user-management/edit-user/edit-user').then((m) => m.EditUser),
      },
    ],
  },
  {
    path: 'notifications',
    loadComponent: () => import('./components/notifications/notifications').then((m) => m.Notifications),
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings').then((m) => m.Settings),
  },
  {
    path: '',
    redirectTo: 'user-management',
    pathMatch: 'full',
  },
];
