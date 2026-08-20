import { Routes } from "@angular/router";
import { TicketListComponent } from "../features/tickets/components/ticket-list/ticket-list.component";
import { CreateTicketComponent } from "../features/tickets/components/create-ticket/create-ticket.component";
import { TicketDetailComponent } from "../features/tickets/components/ticket-detail/ticket-detail.component";

export const ticketRoutes: Routes = [
  { path: "", component: TicketListComponent },
  { path: "new", component: CreateTicketComponent },
  { path: ":id", component: TicketDetailComponent },
];

export const ROUTES: Routes = ticketRoutes;