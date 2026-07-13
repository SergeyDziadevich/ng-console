import { Routes } from '@angular/router';
import { provideExperimentalWebMcpTools } from '@angular/core';

import { authGuard, canMatchAuthGuard, noAuthGuard } from './guards/auth.guard';
import { canUserEdit } from './guards/can-user-edit.guard';
import { isAdminGuard } from './guards/is-admin.guard';
import { addUserTool } from './web-mcp-tools/add-user.tool';

export const routes: Routes = [
  {
    path: 'login',
    // canMatch prevents loading the login chunk when the user is already authenticated
    canMatch: [noAuthGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./components/shell/shell').then((m) => m.Shell),
    // canMatch prevents downloading the shell (and all child) bundles when not authenticated
    canMatch: [canMatchAuthGuard],
    canActivate: [authGuard],
    providers: [provideExperimentalWebMcpTools([addUserTool])],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'ai-assistant',
        loadComponent: () =>
          import('./features/ai-assistant/ai-assistant').then((m) => m.AiAssistant),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./features/user-management/user-management').then((m) => m.UserManagement),
        children: [
          {
            path: 'add-user',
            loadComponent: () =>
              import('./features/user-management/add-user/add-user').then((m) => m.AddUser),
          },
          {
            path: 'edit-user/:id',
            canActivate: [canUserEdit],
            loadComponent: () =>
              import('./features/user-management/edit-user/edit-user').then((m) => m.EditUser),
          },
        ],
      },
      {
        path: 'tickets',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./features/tickets/components/ticket-list/ticket-list.component').then(
                (m) => m.TicketListComponent,
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/tickets/components/create-ticket/create-ticket.component').then(
                (m) => m.CreateTicketComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/tickets/components/ticket-detail/ticket-detail.component').then(
                (m) => m.TicketDetailComponent,
              ),
          },
        ],
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'chats',
        loadComponent: () => import('./features/chat/chat').then((m) => m.Chat),
      },

      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents').then((m) => m.DocumentsComponent),
      },
      {
        path: 'documents/generate',
        loadComponent: () =>
          import('./features/documents/generator/document-generator.component').then(
            (m) => m.DocumentGeneratorComponent,
          ),
      },
      {
        path: 'documents/:id/:mode',
        loadComponent: () =>
          import('./features/documents/viewer/document-viewer.component').then(
            (m) => m.DocumentViewerComponent,
          ),
      },
      {
        path: 'audit-logs',
        canActivate: [isAdminGuard],
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
      },
      {
        path: 'payments/subscriptions',
        loadComponent: () =>
          import('./features/payments/subscriptions.component').then((m) => m.SubscriptionsComponent),
      },
      {
        path: 'payments/billing-history',
        loadComponent: () =>
          import('./features/payments/billing-history/billing-history.component').then((m) => m.BillingHistoryComponent),
      },
      {
        path: 'payments/success',
        loadComponent: () =>
          import('./features/payments/subscriptions-callback/success.component').then((m) => m.PaymentSuccessComponent),
      },
      {
        path: 'payments/cancel',
        loadComponent: () =>
          import('./features/payments/subscriptions-callback/cancel.component').then((m) => m.PaymentCancelComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  // Fallback: when no route matches (e.g. unauthenticated user) redirect to login
  { path: '**', redirectTo: 'login' },
];
