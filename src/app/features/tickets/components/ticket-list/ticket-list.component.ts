import { Component, computed, inject, OnInit, signal, DestroyRef, ChangeDetectionStrategy, linkedSignal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../../../services/user-service';
import { AuthService } from '../../../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TicketStatus, Ticket } from '../../models/ticket.model';
import { SpinnerComponent } from '@ng-console-platform/ui';
import { CdkDragDrop, transferArrayItem, CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-ticket-list',
  imports: [RouterLink, CommonModule, NgOptimizedImage, SpinnerComponent, CdkDrag, CdkDropList, CdkDropListGroup],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  todoTickets = linkedSignal<Ticket[], Ticket[]>({
    source: () => this.filteredTickets(),
    computation: (tickets, previous) => {
      const filtered = tickets.filter(t => t.status === TicketStatus.TODO);
      return previous ? this.preserveOrder(previous.value, filtered) : filtered;
    }
  });

  inProgressTickets = linkedSignal<Ticket[], Ticket[]>({
    source: () => this.filteredTickets(),
    computation: (tickets, previous) => {
      const filtered = tickets.filter(t => t.status === TicketStatus.IN_PROGRESS);
      return previous ? this.preserveOrder(previous.value, filtered) : filtered;
    }
  });

  doneTickets = linkedSignal<Ticket[], Ticket[]>({
    source: () => this.filteredTickets(),
    computation: (tickets, previous) => {
      const filtered = tickets.filter(t => t.status === TicketStatus.DONE);
      return previous ? this.preserveOrder(previous.value, filtered) : filtered;
    }
  });

  preserveOrder(currentList: Ticket[], newList: Ticket[]): Ticket[] {
    const newListMap = new Map(newList.map(t => [t.id, t]));
    const result: Ticket[] = [];
    for (const currentTicket of currentList) {
      if (newListMap.has(currentTicket.id)) {
        result.push(newListMap.get(currentTicket.id)!);
        newListMap.delete(currentTicket.id);
      }
    }
    result.push(...Array.from(newListMap.values()));
    return result;
  }

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

  onDrop(event: CdkDragDrop<Ticket[]>, targetStatus: TicketStatus) {
    if (event.previousContainer === event.container) {
      // Swap items instead of shifting them
      const data = event.container.data;
      const prev = event.previousIndex;
      const curr = event.currentIndex;

      if (prev !== curr) {
        const temp = data[prev];
        data[prev] = data[curr];
        data[curr] = temp;

        // Force Angular change detection by updating the array reference
        if (targetStatus === TicketStatus.TODO) {
          this.todoTickets.set([...data]);
        } else if (targetStatus === TicketStatus.IN_PROGRESS) {
          this.inProgressTickets.set([...data]);
        } else if (targetStatus === TicketStatus.DONE) {
          this.doneTickets.set([...data]);
        }
      }
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const ticket = event.container.data[event.currentIndex];
      
      this.ticketService.updateTicket(ticket.id, { status: targetStatus }).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.ticketsResource.reload();
        },
        error: (err) => {
          console.error('Failed to update ticket status', err);
        }
      });
    }
  }
}

