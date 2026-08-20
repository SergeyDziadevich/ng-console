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
    loadComponent: () => import('./features/login/login.component').then((m) => m.Login),
  },
  {
    path: 'sign-invoice',
    loadComponent: () =>
      import('./features/documents/external-signature/external-signature.component').then(
        (m) => m.ExternalSignatureComponent
      ),
  },
  {
    path: '',
    loadComponent: () => import('@ng-console/shared/layout').then((m) => m.Shell),
    // canMatch prevents downloading the shell (and all child) bundles when not authenticated
    canMatch: [canMatchAuthGuard],
    canActivate: [authGuard],
    providers: [provideExperimentalWebMcpTools([addUserTool])],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.Dashboard),
      },
      {
        path: 'ai-assistant',
        loadComponent: () =>
          import('./features/ai-assistant/ai-assistant.component').then((m) => m.AiAssistant),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./features/user-management/user-management.component').then((m) => m.UserManagement),
        children: [
          {
            path: 'add-user',
            loadComponent: () =>
              import('./features/user-management/add-user/add-user.component').then((m) => m.AddUser),
          },
          {
            path: 'edit-user/:id',
            canActivate: [canUserEdit],
            loadComponent: () =>
              import('./features/user-management/edit-user/edit-user.component').then((m) => m.EditUser),
          },
        ],
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.Customers),
        children: [
          {
            path: 'add-customer',
            loadComponent: () =>
              import('./features/customers/add-customer/add-customer.component').then((m) => m.AddCustomer),
          },
          {
            path: 'edit-customer/:id',
            loadComponent: () =>
              import('./features/customers/edit-customer/edit-customer.component').then((m) => m.EditCustomer),
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
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.Settings),
      },
      {
        path: 'chats',
        loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
      },

      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents.component').then((m) => m.DocumentsComponent),
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
        path: 'payments',
        children: [
          {
            path: 'subscriptions',
            loadComponent: () =>
              import('./features/payments/subscriptions.component').then((m) => m.SubscriptionsComponent),
          },
          {
            path: 'billing-history',
            loadComponent: () =>
              import('./features/payments/billing-history/billing-history.component').then((m) => m.BillingHistoryComponent),
          },
          {
            path: 'success',
            loadComponent: () =>
              import('./features/payments/subscriptions-callback/success.component').then((m) => m.PaymentSuccessComponent),
          },
          {
            path: 'cancel',
            loadComponent: () =>
              import('./features/payments/subscriptions-callback/cancel.component').then((m) => m.PaymentCancelComponent),
          },
        ],
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
