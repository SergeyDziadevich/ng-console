import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField, FormRoot, required, min } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../../../services/user-service';
import { Ticket, TicketPriority, TicketStatus } from '../../models/ticket.model';
import { Toast } from '../../../../components/toast/toast';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [FormField, FormRoot, RouterLink, CommonModule, Toast],
  templateUrl: './create-ticket.component.html',
})
export class CreateTicketComponent implements OnInit {
  ticketService = inject(TicketService);
  userService = inject(UserService);
  router = inject(Router);

  usersResource = this.userService.usersResource;
  epicsResource = this.ticketService.epicsResource;

  ticketModel = signal({
    title: '',
    description: '',
    about: '',
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    assignedPersonId: '',
    epicId: '',
    estimations: null as number | null,
  });

  ticketForm = form(this.ticketModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Title is required' });
    required(schemaPath.description, { message: 'Description is required' });
    min(schemaPath.estimations, 0, { message: 'Estimation cannot be negative' });
  }, {
    submission: {
      action: async () => {
        if (this.ticketForm().invalid()) {
          return undefined;
        }

        this.isSubmitting.set(true);

        const formVal = this.ticketModel();
        const ticketData = {
          title: formVal.title,
          description: formVal.description,
          about: formVal.about || undefined,
          status: formVal.status,
          priority: formVal.priority,
          assignedPersonId: formVal.assignedPersonId || undefined,
          estimations: formVal.estimations || undefined,
          epic: formVal.epicId ? { id: Number(formVal.epicId) } : undefined,
        };

        try {
          await firstValueFrom(this.ticketService.createTicket(ticketData as unknown as Partial<Ticket>));
          this.isSubmitting.set(false);
          this.showToast.set(true);
          setTimeout(() => {
            this.router.navigate(['/tickets']);
          }, 1500);
          return undefined;
        } catch (err) {
          console.error('Error creating ticket:', err);
          this.isSubmitting.set(false);
          return undefined;
        }
      }
    }
  });

  isSubmitting = signal(false);
  showToast = signal(false);

  // Enum references for template
  TicketStatus = TicketStatus;
  TicketPriority = TicketPriority;

  ngOnInit() {
    this.usersResource.reload();
    this.epicsResource.reload();
  }

}
