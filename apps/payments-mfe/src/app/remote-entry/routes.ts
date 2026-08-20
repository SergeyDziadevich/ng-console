import { Routes } from "@angular/router";
import { SubscriptionsComponent } from "../features/payments/subscriptions.component";
import { BillingHistoryComponent } from "../features/payments/billing-history/billing-history.component";
import { SuccessComponent } from "../features/payments/subscriptions-callback/success.component";
import { CancelComponent } from "../features/payments/subscriptions-callback/cancel.component";

export const paymentRoutes: Routes = [
  { path: "", redirectTo: "subscriptions", pathMatch: "full" },
  { path: "subscriptions", component: SubscriptionsComponent },
  { path: "billing-history", component: BillingHistoryComponent },
  { path: "success", component: SuccessComponent },
  { path: "cancel", component: CancelComponent },
];

export const ROUTES: Routes = paymentRoutes;