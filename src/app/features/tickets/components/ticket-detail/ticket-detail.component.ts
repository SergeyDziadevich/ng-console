import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { TicketService } from '../../services/ticket.service';
import { Ticket, TicketStatus, TicketPriority } from '../../models/ticket.model';
import { UserService } from '../../../../services/user-service';
import { SvgIconComponent } from '@ng-console-platform/ui';
import { firstValueFrom } from 'rxjs';
import { form, FormField, FormRoot, required, min } from '@angular/forms/signals';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmDialogComponent, SpinnerComponent } from '@ng-console-platform/ui';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    QuillModule,
    SvgIconComponent,
    FormField,
    FormRoot,
    ConfirmDialogComponent,
    SpinnerComponent,
  ],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ticket = signal<Ticket | null>(null);
  isLoading = signal(true);
  error = signal(false);
  newCommentText = signal('');

  usersResource = this.userService.usersResource;
  epicsResource = this.ticketService.epicsResource;

  canDeleteTicket = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'admin' || user?.role === 'moderator';
  });

  isEditing = signal(false);
  showDeleteConfirm = signal(false);

  ngOnInit() {
    this.usersResource.reload();
    this.epicsResource.reload();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTicket(id);
    } else {
      this.isLoading.set(false);
      this.error.set(true);
    }
  }

  loadTicket(id: string) {
    this.isLoading.set(true);
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      },
    });
  }

  ticketModel = signal({
    title: '',
    description: '',
    about: '',
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    estimations: null as number | null,
    assignedPersonId: '',
    epicId: '',
  });

  ticketForm = form(
    this.ticketModel,
    (schemaPath) => {
      required(schemaPath.title, { message: 'Title is required' });
      required(schemaPath.description, { message: 'Description is required' });
      min(schemaPath.estimations, 0, { message: 'Estimation cannot be negative' });
    },
    {
      submission: {
        action: async () => {
          if (this.ticketForm().invalid()) return undefined;

          const t = this.ticket();
          if (!t) return undefined;

          const val = this.ticketModel();
          const epicId = val.epicId ? Number(val.epicId) : null;
          const epicObj = epicId
            ? {
                id: epicId,
                name: this.epicsResource.value()?.find((e) => e.id === epicId)?.name || '',
              }
            : undefined;

          const payload: Record<string, unknown> = {
            title: val.title,
            description: val.description,
            about: val.about || '',
            status: val.status,
            priority: val.priority,
            estimations: val.estimations || undefined,
            assignedPersonId: val.assignedPersonId || undefined,
          };

          if (epicObj) {
            payload['epic'] = epicObj;
          } else {
            payload['epic'] = null;
          }

          try {
            await firstValueFrom(this.ticketService.updateTicket(t.id, payload));
            this.ticket.update((ticket) =>
              ticket
                ? {
                    ...ticket,
                    title: val.title,
                    description: val.description,
                    about: val.about,
                    status: val.status,
                    priority: val.priority,
                    estimations: val.estimations || undefined,
                    assignedPersonId: val.assignedPersonId || undefined,
                    epic: epicObj,
                  }
                : null,
            );
            this.isEditing.set(false);
            return undefined;
          } catch (err) {
            console.error('Error updating ticket:', err);
            return undefined;
          }
        },
      },
    },
  );

  addComment() {
    const t = this.ticket();
    const text = this.newCommentText().trim();
    if (!t || !text) return;

    this.ticketService.addComment(t.id, text).subscribe((comment) => {
      const currentComments = t.comments || [];
      this.ticket.update((ticket) =>
        ticket ? { ...ticket, comments: [...currentComments, comment] } : null,
      );
      this.newCommentText.set('');
    });
  }

  getAssignedPersonName(): string {
    const t = this.ticket();
    if (!t || !t.assignedPersonId) return 'Unassigned';

    const users = this.usersResource.value();
    if (users) {
      const user = users.find((u) => u._id === t.assignedPersonId);
      if (user) {
        return user.displayName || user.username;
      }
    }

    return t.assignedPersonId;
  }

  editTicket() {
    const t = this.ticket();
    if (t) {
      this.ticketModel.set({
        title: t.title || '',
        description: t.description || '',
        about: t.about || '',
        status: t.status,
        priority: t.priority || TicketPriority.MEDIUM,
        estimations: t.estimations || null,
        assignedPersonId: t.assignedPersonId || '',
        epicId: t.epic?.id?.toString() || '',
      });
      this.isEditing.set(true);
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  deleteTicket() {
    const t = this.ticket();
    if (!t) return;
    this.ticketService.deleteTicket(t.id).subscribe({
      next: () => {
        this.router.navigate(['/tickets']);
      },
      error: (err) => {
        console.error('Failed to delete ticket', err);
        alert('Failed to delete ticket.');
        this.showDeleteConfirm.set(false);
      },
    });
  }

  confirmDelete() {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
  }
}
