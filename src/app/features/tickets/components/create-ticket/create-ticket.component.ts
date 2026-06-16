import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../../../services/user-service';
import { TicketPriority, TicketStatus } from '../../models/ticket.model';
import { Toast } from '../../../../components/toast/toast';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, Toast],
  templateUrl: './create-ticket.component.html',
})
export class CreateTicketComponent implements OnInit {
  ticketService = inject(TicketService);
  userService = inject(UserService);
  router = inject(Router);

  usersResource = this.userService.usersResource;
  epicsResource = this.ticketService.epicsResource;

  // Form fields as signals
  title = signal('');
  description = signal('');
  about = signal('');
  status = signal<TicketStatus>(TicketStatus.TODO);
  priority = signal<TicketPriority>(TicketPriority.MEDIUM);
  assignedPersonId = signal<string>('');
  epicId = signal<string>('');
  estimations = signal<number | null>(null);

  isSubmitting = signal(false);
  showToast = signal(false);
  
  // Enum references for template
  TicketStatus = TicketStatus;
  TicketPriority = TicketPriority;

  ngOnInit() {
    this.usersResource.reload();
    this.epicsResource.reload();
  }

  onSubmit(form: any) {
    if (form.invalid || !this.title() || !this.description()) {
      return;
    }

    this.isSubmitting.set(true);

    const ticketData = {
      title: this.title(),
      description: this.description(),
      about: this.about() || undefined,
      status: this.status(),
      priority: this.priority(),
      assignedPersonId: this.assignedPersonId() || undefined,
      estimations: this.estimations() || undefined,
      epic: this.epicId() ? { id: Number(this.epicId()) } : undefined,
    };

    this.ticketService.createTicket(ticketData as any).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showToast.set(true);
        setTimeout(() => {
          this.router.navigate(['/tickets']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creating ticket:', err);
        this.isSubmitting.set(false);
      }
    });
  }
}
