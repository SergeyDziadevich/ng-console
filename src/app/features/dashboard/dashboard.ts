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

  ngOnInit() {
    this.ticketsResource.reload();
  }
}
