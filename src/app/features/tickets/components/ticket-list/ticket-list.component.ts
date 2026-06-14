import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './ticket-list.component.html',
})
export class TicketListComponent implements OnInit {
  ticketService = inject(TicketService);
  ticketsResource = this.ticketService.ticketsResource;

  ngOnInit() {
    this.ticketsResource.reload();
  }
}
