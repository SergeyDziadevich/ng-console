import { Routes } from '@angular/router';
import { authGuard, canMatchAuthGuard, noAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    // canMatch prevents loading the login chunk when the user is already authenticated
    canMatch: [noAuthGuard],
    loadComponent: () => import('./components/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./components/shell/shell').then((m) => m.Shell),
    // canMatch prevents downloading the shell (and all child) bundles when not authenticated
    canMatch: [canMatchAuthGuard],
    canActivate: [authGuard],
    children: [
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
        ],
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./components/notifications/notifications').then((m) => m.Notifications),
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
    ],
  },
  // Fallback: when no route matches (e.g. unauthenticated user) redirect to login
  { path: '**', redirectTo: 'login' },
];
