import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { TicketService } from '../../services/ticket.service';
import { Ticket, TicketStatus, TicketPriority } from '../../models/ticket.model';
import { UserService } from '../../../../services/user-service';
import { SvgIconComponent } from '../../../../components/icons/svg-icon.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuillModule, SvgIconComponent],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  private userService = inject(UserService);

  ticket = signal<Ticket | null>(null);
  isLoading = signal(true);
  error = signal(false);
  newCommentText = signal('');

  usersResource = this.userService.usersResource;
  epicsResource = this.ticketService.epicsResource;

  isEditing = signal(false);
  editableTitle = signal('');
  editableDescription = signal('');
  editableAbout = signal('');
  editableStatus = signal<TicketStatus>(TicketStatus.TODO);
  editablePriority = signal<TicketPriority>(TicketPriority.MEDIUM);
  editableEstimations = signal<number | null>(null);
  editableAssignedPersonId = signal<string | null>(null);
  editableEpicId = signal<string>('');

  ngOnInit() {
    this.usersResource.reload();
    this.epicsResource.reload();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadTicket(id);
    } else {
      this.isLoading.set(false);
      this.error.set(true);
    }
  }

  loadTicket(id: number) {
    this.isLoading.set(true);
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      }
    });
  }

  addComment() {
    const t = this.ticket();
    const text = this.newCommentText().trim();
    if (!t || !text) return;

    this.ticketService.addComment(t.id, text).subscribe(comment => {
      const currentComments = t.comments || [];
      this.ticket.update(ticket => ticket ? { ...ticket, comments: [...currentComments, comment] } : null);
      this.newCommentText.set('');
    });
  }

  getAssignedPersonName(): string {
    const t = this.ticket();
    if (!t || !t.assignedPersonId) return 'Unassigned';

    const users = this.usersResource.value();
    if (users) {
      const user = users.find(u => u._id === t.assignedPersonId);
      if (user) {
        return user.displayName || user.username;
      }
    }

    return t.assignedPersonId;
  }

  editTicket() {
    const t = this.ticket();
    if (t) {
      this.editableTitle.set(t.title || '');
      this.editableDescription.set(t.description || '');
      this.editableAbout.set(t.about || '');
      this.editableStatus.set(t.status);
      this.editablePriority.set(t.priority || TicketPriority.MEDIUM);
      this.editableEstimations.set(t.estimations || null);
      this.editableAssignedPersonId.set(t.assignedPersonId || null);
      this.editableEpicId.set(t.epic?.id?.toString() || '');
      this.isEditing.set(true);
    }
  }

  saveTicket() {
    const t = this.ticket();
    if (!t) return;
    const title = this.editableTitle();
    const desc = this.editableDescription();
    const about = this.editableAbout();
    const status = this.editableStatus();
    const priority = this.editablePriority();
    const estimations = this.editableEstimations() || undefined;
    const assignedPersonId = this.editableAssignedPersonId() || undefined;
    const epicId = this.editableEpicId() ? Number(this.editableEpicId()) : null;
    const epicObj = epicId ? { id: epicId, name: this.epicsResource.value()?.find(e => e.id === epicId)?.name || '' } : undefined;
    // TypeORM update with { epic: epicObj } works since entity has @ManyToOne to EpicTag
    const payload: any = { title, description: desc, about, status, priority, estimations, assignedPersonId };
    if (epicObj) {
      payload.epic = epicObj;
    } else {
      payload.epic = null;
    }

    this.ticketService.updateTicket(t.id, payload).subscribe(() => {
      this.ticket.update(ticket => ticket ? { ...ticket, title, description: desc, about, status, priority, estimations, assignedPersonId, epic: epicObj } : null);
      this.isEditing.set(false);
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
  }
}
