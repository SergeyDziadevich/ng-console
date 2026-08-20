import { Routes } from "@angular/router";
import { ChatComponent } from "../features/chat/chat.component";
import { NotificationsComponent } from "../features/notifications/notifications.component";

export const chatRoutes: Routes = [
  { path: "", component: ChatComponent },
];

export const notificationRoutes: Routes = [
  { path: "", component: NotificationsComponent },
];

export const ROUTES: Routes = [
  { path: "notifications", children: notificationRoutes },
  { path: "", children: chatRoutes },
];