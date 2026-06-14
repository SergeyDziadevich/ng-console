import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-detail.component.html',
  styles: [`
    .comments-section { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
    .comment { background: #f9f9f9; padding: 10px; margin-bottom: 5px; border-radius: 4px; }
  `]
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  
  ticket?: Ticket;
  newCommentText = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadTicket(id);
    }
  }

  loadTicket(id: number) {
    this.ticketService.getTicket(id).subscribe(ticket => {
      this.ticket = ticket;
    });
  }

  addComment() {
    if (!this.ticket || !this.newCommentText.trim()) return;
    
    this.ticketService.addComment(this.ticket.id, this.newCommentText).subscribe(comment => {
      if (!this.ticket!.comments) {
        this.ticket!.comments = [];
      }
      this.ticket!.comments.push(comment);
      this.newCommentText = '';
    });
  }
}
