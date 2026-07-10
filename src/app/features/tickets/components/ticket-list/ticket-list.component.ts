import { Component, computed, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../../../services/user-service';
import { AuthService } from '../../../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TicketStatus } from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './ticket-list.component.html',
})
export class TicketListComponent implements OnInit {
  TicketStatus = TicketStatus;

  ticketService = inject(TicketService);
  userService = inject(UserService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  destroyRef = inject(DestroyRef);

  ticketsResource = this.ticketService.ticketsResource;
  usersResource = this.userService.usersResource;
  epicsResource = this.ticketService.epicsResource;

  showAssignedToMeOnly = signal(false);
  selectedEpicId = signal<string>('');
  selectedStatuses = signal<Set<TicketStatus>>(new Set());
  isCompactView = signal(false);

  filteredTickets = computed(() => {
    const tickets = this.ticketsResource.value();
    const user = this.authService.currentUser();

    if (!tickets) return [];

    let filtered = tickets;

    if (this.showAssignedToMeOnly() && user?.id) {
      filtered = filtered.filter((t) => t.assignedPersonId === user.id);
    }

    if (this.selectedEpicId()) {
      filtered = filtered.filter((t) => t.epic?.id.toString() === this.selectedEpicId());
    }

    if (this.selectedStatuses().size > 0) {
      filtered = filtered.filter((t) => this.selectedStatuses().has(t.status));
    }

    return filtered;
  });

  ngOnInit() {
    this.ticketsResource.reload();
    this.usersResource.reload();
    this.epicsResource.reload();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.showAssignedToMeOnly.set(params['assignedToMe'] === 'true');
      this.selectedEpicId.set(params['epicId'] || '');
      this.isCompactView.set(params['view'] === 'compact');

      const statuses = params['status'];
      if (statuses) {
        const statusArray = Array.isArray(statuses) ? statuses : statuses.split(',');
        this.selectedStatuses.set(new Set(statusArray as TicketStatus[]));
      } else {
        this.selectedStatuses.set(new Set());
      }
    });
  }

  toggleAssignedToMeFilter() {
    const currentValue = this.showAssignedToMeOnly();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { assignedToMe: !currentValue ? 'true' : undefined },
      queryParamsHandling: 'merge',
    });
  }

  toggleCompactView() {
    const isCompact = this.isCompactView();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: !isCompact ? 'compact' : undefined },
      queryParamsHandling: 'merge',
    });
  }

  onEpicChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { epicId: value || undefined },
      queryParamsHandling: 'merge',
    });
  }

  hasStatusFilter(status: TicketStatus): boolean {
    return this.selectedStatuses().has(status);
  }

  toggleStatusFilter(status: TicketStatus) {
    const current = new Set(this.selectedStatuses());
    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }

    const statusArray = Array.from(current);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: statusArray.length > 0 ? statusArray.join(',') : undefined },
      queryParamsHandling: 'merge',
    });
  }

  getAssignedPersonName(assignedPersonId?: string): string {
    if (!assignedPersonId) return 'Unassigned';

    const users = this.usersResource.value();
    if (users) {
      const user = users.find((u) => u._id === assignedPersonId);
      if (user) {
        return user.displayName || user.username;
      }
    }

    return assignedPersonId;
  }
}
