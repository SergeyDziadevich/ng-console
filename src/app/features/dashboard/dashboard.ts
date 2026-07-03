import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../features/tickets/services/ticket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private ticketService = inject(TicketService);

  currentUser = this.authService.currentUser;
  ticketsResource = this.ticketService.ticketsResource;

  assignedTicketsCount = computed(() => {
    const user = this.currentUser();
    const tickets = this.ticketsResource.value();
    
    if (!user || !user.id || !tickets) return 0;
    
    return tickets.filter(t => t.assignedPersonId === user.id).length;
  });

  inProgressTickets = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return [];
    return tickets.filter(t => t.status === 'in progress');
  });

  doneTickets = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return [];
    return tickets.filter(t => t.status === 'done');
  });

  todoTicketsCount = computed(() => {
    const tickets = this.ticketsResource.value();
    if (!tickets) return 0;
    return tickets.filter(t => t.status === 'todo').length;
  });

  inProgressTicketsCount = computed(() => this.inProgressTickets().length);
  doneTicketsCount = computed(() => this.doneTickets().length);

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
  }
}
