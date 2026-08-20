import { Routes } from "@angular/router";
import { loadRemoteModule } from "@angular-architects/native-federation";
import { authGuard, canMatchAuthGuard, noAuthGuard, isAdminGuard } from "@ng-console/shared/util";

interface RemoteRouteModule {
  ROUTES?: Routes;
  [key: string]: unknown;
}

export const routes: Routes = [
  {
    path: "login",
    canMatch: [noAuthGuard],
    loadComponent: () => import("./features/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "sign-invoice",
    loadChildren: () =>
      loadRemoteModule({ remoteName: "documents-mfe", exposedModule: "./Routes" }).then(
        (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { externalSignatureRoutes?: Routes }).externalSignatureRoutes || []
      ),
  },
  {
    path: "",
    loadComponent: () => import("@ng-console/shared/layout").then((m) => m.ShellComponent),
    canMatch: [canMatchAuthGuard],
    canActivate: [authGuard],
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then((m) => m.DashboardComponent),
      },
      {
        path: "user-management",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "users-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { userManagementRoutes?: Routes }).userManagementRoutes || []
          ),
      },
      {
        path: "customers",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "users-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { customersRoutes?: Routes }).customersRoutes || []
          ),
      },
      {
        path: "tickets",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "tickets-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { ticketRoutes?: Routes }).ticketRoutes || []
          ),
      },
      {
        path: "documents",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "documents-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { documentRoutes?: Routes }).documentRoutes || []
          ),
      },
      {
        path: "payments",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "payments-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { paymentRoutes?: Routes }).paymentRoutes || []
          ),
      },
      {
        path: "chats",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "chat-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { chatRoutes?: Routes }).chatRoutes || []
          ),
      },
      {
        path: "notifications",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "chat-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { notificationRoutes?: Routes }).notificationRoutes || []
          ),
      },
      {
        path: "ai-assistant",
        loadChildren: () =>
          loadRemoteModule({ remoteName: "ai-assistant-mfe", exposedModule: "./Routes" }).then(
            (m: unknown) => (m as RemoteRouteModule).ROUTES || (m as { aiAssistantRoutes?: Routes }).aiAssistantRoutes || []
          ),
      },
      {
        path: "audit-logs",
        canActivate: [isAdminGuard],
        loadComponent: () =>
          import("./features/audit-logs/audit-logs.component").then((m) => m.AuditLogsComponent),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./features/settings/settings.component").then((m) => m.SettingsComponent),
      },
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
    ],
  },
  { path: "**", redirectTo: "login" },
];