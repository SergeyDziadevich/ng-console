import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket-list.component.html',
  styles: [`
    .ticket-card { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
    .status { font-weight: bold; }
  `]
})
export class TicketListComponent implements OnInit {
  private ticketService = inject(TicketService);
  tickets: Ticket[] = [];

  ngOnInit() {
    this.ticketService.getTickets().subscribe(tickets => {
      this.tickets = tickets;
    });
  }
}
