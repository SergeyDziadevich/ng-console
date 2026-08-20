import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from "@ng-console/shared/ui";
import { AuthService } from "@ng-console/shared/data-access";
import { TicketService } from '../../features/tickets/services/ticket.service';
import { DocumentService } from "@ng-console/shared/data-access";
import { PaymentsService } from "@ng-console/shared/data-access";

import { TranslatePipe } from "@ng-console/shared/util";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, SpinnerComponent, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private ticketService = inject(TicketService);
  private documentService = inject(DocumentService);
  private paymentsService = inject(PaymentsService);

  currentUser = this.authService.currentUser;
  ticketsResource = this.ticketService.ticketsResource;
  totalDocuments = signal<number>(0);
  isLoadingDocuments = signal<boolean>(true);

  planName = computed(() => {
    const planId = this.currentUser()?.planId;
    if (!planId) return '';
    if (planId === 'price_1Tsh1w3C6FGO2xjMcR62X9Po') return 'Pro';
    if (planId === 'price_1Tsh4Y3C6FGO2xjMaTpgehz2') return 'Premium';
    return 'Subscribed';
  });

  assignedTicketsCount = computed(() => {
    const user = this.currentUser();
    const tickets = this.ticketsResource.value();

    if (!user || !user.id || !tickets) return 0;

    return tickets.filter((t) => t.assignedPersonId === user.id).length;
  });

  inProgressTickets = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return [];
    return tickets.filter((t) => t.status === 'in progress').slice(0, 4);
  });

  doneTickets = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return [];
    return tickets.filter((t) => t.status === 'done').slice(0, 4);
  });

  todoTicketsCount = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return 0;
    return tickets.filter((t) => t.status === 'todo').length;
  });

  inProgressTicketsCount = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return 0;
    return tickets.filter((t) => t.status === 'in progress').length;
  });

  doneTicketsCount = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return 0;
    return tickets.filter((t) => t.status === 'done').length;
  });

  totalTickets = computed(() => {
    const tickets = this.ticketsResource.value();
    return tickets ? tickets.length : 0;
  });

  ticketChartGradient = computed(() => {
    const todo = this.todoTicketsCount();
    const inProgress = this.inProgressTicketsCount();
    const done = this.doneTicketsCount();
    const total = todo + inProgress + done;

    if (total === 0) {
      return 'conic-gradient(#f3f4f6 100%, transparent 0)';
    }

    const todoPct = (todo / total) * 100;
    const inProgressPct = (inProgress / total) * 100;

    // Gray-400 for Todo, Blue-500 for In Progress, Green-500 for Done
    return `conic-gradient(#9ca3af 0% ${todoPct}%, #3b82f6 ${todoPct}% ${todoPct + inProgressPct}%, #22c55e ${todoPct + inProgressPct}% 100%)`;
  });

  ngOnInit() {
    this.ticketsResource.reload();
    this.documentService.getDocuments(1, 1).subscribe({
      next: (res) => {
        this.totalDocuments.set(res.total);
        this.isLoadingDocuments.set(false);
      },
      error: () => {
        this.isLoadingDocuments.set(false);
      },
    });
  }
}
