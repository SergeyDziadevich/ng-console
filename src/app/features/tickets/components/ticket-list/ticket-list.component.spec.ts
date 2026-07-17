import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { TicketListComponent } from './ticket-list.component';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../../../services/user-service';
import { AuthService } from '../../../../services/auth.service';
import { Ticket, TicketStatus } from '../../models/ticket.model';

interface MockTicketService {
  ticketsResource: {
    value: ReturnType<typeof signal<Ticket[] | undefined>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<unknown>>;
    reload: Mock;
  };
  epicsResource: {
    value: ReturnType<typeof signal<unknown[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<unknown>>;
    reload: Mock;
  };
  updateTicket: Mock;
}

interface MockUserService {
  usersResource: {
    value: ReturnType<typeof signal<unknown[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<unknown>>;
    reload: Mock;
  };
}

describe('TicketListComponent', () => {
  let component: TicketListComponent;
  let fixture: ComponentFixture<TicketListComponent>;
  let mockTicketService: MockTicketService;
  let mockUserService: MockUserService;
  let mockAuthService: {
    currentUser: ReturnType<typeof signal<{ id?: string; role?: string } | null>>;
  };
  let mockRouter: Router;

  beforeEach(async () => {
    mockTicketService = {
      ticketsResource: {
        value: signal(undefined),
        isLoading: signal(false),
        error: signal(undefined),
        reload: vi.fn(),
      },
      epicsResource: {
        value: signal([]),
        isLoading: signal(false),
        error: signal(undefined),
        reload: vi.fn(),
      },
      updateTicket: vi.fn().mockReturnValue(of({})),
    };

    mockUserService = {
      usersResource: {
        value: signal([]),
        isLoading: signal(false),
        error: signal(undefined),
        reload: vi.fn(),
      },
    };

    mockAuthService = {
      currentUser: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [
        { provide: TicketService, useValue: mockTicketService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    mockRouter = TestBed.inject(Router);
    vi.spyOn(mockRouter, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(TicketListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reload resources on init', () => {
    fixture.detectChanges(); // calls ngOnInit
    expect(mockTicketService.ticketsResource.reload).toHaveBeenCalled();
    expect(mockUserService.usersResource.reload).toHaveBeenCalled();
    expect(mockTicketService.epicsResource.reload).toHaveBeenCalled();
  });

  describe('Filtering', () => {
    const mockTickets: Partial<Ticket>[] = [
      {
        id: '1',
        title: 'T1',
        status: TicketStatus.TODO,
        assignedPersonId: 'user1',
        epic: { id: 10, name: 'Epic 1' },
      },
      {
        id: '2',
        title: 'T2',
        status: TicketStatus.IN_PROGRESS,
        assignedPersonId: 'user2',
        epic: { id: 20, name: 'Epic 2' },
      },
      {
        id: '3',
        title: 'T3',
        status: TicketStatus.DONE,
        assignedPersonId: 'user1',
        epic: { id: 10, name: 'Epic 1' },
      },
    ];

    beforeEach(() => {
      mockTicketService.ticketsResource.value.set(mockTickets as Ticket[]);
      mockAuthService.currentUser.set({ id: 'user1' });
    });

    it('should return all tickets if no filters applied', () => {
      const filtered = component.filteredTickets();
      expect(filtered.length).toBe(3);
    });

    it('should filter by assigned to me', () => {
      component.showAssignedToMeOnly.set(true);
      const filtered = component.filteredTickets();
      expect(filtered.length).toBe(2);
      expect(filtered.every((t) => t.assignedPersonId === 'user1')).toBe(true);
    });

    it('should filter by epic id', () => {
      component.selectedEpicId.set('10');
      const filtered = component.filteredTickets();
      expect(filtered.length).toBe(2);
      expect(filtered.every((t) => t.epic?.id === 10)).toBe(true);
    });

    it('should filter by statuses', () => {
      component.selectedStatuses.set(new Set([TicketStatus.IN_PROGRESS, TicketStatus.DONE]));
      const filtered = component.filteredTickets();
      expect(filtered.length).toBe(2);
      expect(filtered.find((t) => t.id === '2')).toBeTruthy();
      expect(filtered.find((t) => t.id === '3')).toBeTruthy();
    });

    it('should combine filters correctly', () => {
      component.showAssignedToMeOnly.set(true);
      component.selectedEpicId.set('10');
      component.selectedStatuses.set(new Set([TicketStatus.TODO]));
      const filtered = component.filteredTickets();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('toggle methods routing', () => {
    it('should navigate on toggleAssignedToMeFilter', () => {
      component.toggleAssignedToMeFilter();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { assignedToMe: 'true' },
        }),
      );
    });

    it('should navigate on toggleStatusFilter', () => {
      component.toggleStatusFilter(TicketStatus.IN_PROGRESS);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { status: TicketStatus.IN_PROGRESS },
        }),
      );
    });

    it('should remove status filter if already present', () => {
      component.selectedStatuses.set(new Set([TicketStatus.TODO]));
      component.toggleStatusFilter(TicketStatus.TODO);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { status: undefined },
        }),
      );
    });

    it('should navigate on epic change', () => {
      const mockEvent = { target: { value: '55' } } as unknown as Event;
      component.onEpicChange(mockEvent);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { epicId: '55' },
        }),
      );
    });

    it('should navigate on toggleCompactView (enable)', () => {
      component.isCompactView.set(false);
      component.toggleCompactView();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { view: 'compact' },
        }),
      );
    });

    it('should navigate on toggleCompactView (disable)', () => {
      component.isCompactView.set(true);
      component.toggleCompactView();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { view: undefined },
        }),
      );
    });
  });

  describe('getAssignedPersonName', () => {
    beforeEach(() => {
      mockUserService.usersResource.value.set([
        { _id: 'user1', displayName: 'John Doe' },
        { _id: 'user2', username: 'janedoe' },
      ]);
    });

    it('should return Unassigned if no ID provided', () => {
      expect(component.getAssignedPersonName(undefined)).toBe('Unassigned');
    });

    it('should return display name if available', () => {
      expect(component.getAssignedPersonName('user1')).toBe('John Doe');
    });

    it('should return username if display name is not available', () => {
      expect(component.getAssignedPersonName('user2')).toBe('janedoe');
    });

    it('should return ID if user is not found', () => {
      expect(component.getAssignedPersonName('user3')).toBe('user3');
    });
  });

  describe('Ticket Categorization', () => {
    const mockTickets: Partial<Ticket>[] = [
      { id: '1', title: 'T1', status: TicketStatus.TODO },
      { id: '2', title: 'T2', status: TicketStatus.IN_PROGRESS },
      { id: '3', title: 'T3', status: TicketStatus.DONE },
      { id: '4', title: 'T4', status: TicketStatus.TODO },
    ];

    beforeEach(() => {
      mockTicketService.ticketsResource.value.set(mockTickets as Ticket[]);
      fixture.detectChanges();
    });

    it('should split filteredTickets into respective status signals', () => {
      const todo = component.todoTickets();
      const inProgress = component.inProgressTickets();
      const done = component.doneTickets();

      expect(todo.length).toBe(2);
      expect(todo[0].id).toBe('1');
      expect(todo[1].id).toBe('4');

      expect(inProgress.length).toBe(1);
      expect(inProgress[0].id).toBe('2');

      expect(done.length).toBe(1);
      expect(done[0].id).toBe('3');
    });
  });

  describe('onDrop', () => {
    it('should update signal when dropped in the same container', () => {
      const mockTickets: Partial<Ticket>[] = [
        { id: '1', title: 'T1', status: TicketStatus.TODO },
        { id: '2', title: 'T2', status: TicketStatus.TODO },
      ];
      mockTicketService.ticketsResource.value.set(mockTickets as Ticket[]);
      fixture.detectChanges();

      const containerData = component.todoTickets();

      const mockEvent = {
        previousContainer: { data: containerData },
        container: { data: containerData },
        previousIndex: 0,
        currentIndex: 1,
      } as unknown as CdkDragDrop<Ticket[]>;

      component.onDrop(mockEvent, TicketStatus.TODO);

      expect(component.todoTickets()[0].id).toBe('2');
      expect(component.todoTickets()[1].id).toBe('1');
    });

    it('should call updateTicket when dropped in a different container', () => {
      const mockEvent = {
        previousContainer: { data: [{ id: '1', status: TicketStatus.TODO }] },
        container: { data: [] },
        previousIndex: 0,
        currentIndex: 0,
      } as unknown as CdkDragDrop<Ticket[]>;

      component.onDrop(mockEvent, TicketStatus.IN_PROGRESS);

      expect(mockTicketService.updateTicket).toHaveBeenCalledWith('1', { status: TicketStatus.IN_PROGRESS });
      expect(mockTicketService.ticketsResource.reload).toHaveBeenCalled();
    });

    it('should update inProgressTickets signal when swapped in same container', () => {
      const mockTickets: Partial<Ticket>[] = [
        { id: '1', title: 'T1', status: TicketStatus.IN_PROGRESS },
        { id: '2', title: 'T2', status: TicketStatus.IN_PROGRESS },
      ];
      mockTicketService.ticketsResource.value.set(mockTickets as Ticket[]);
      fixture.detectChanges();

      const containerData = component.inProgressTickets();
      const mockEvent = {
        previousContainer: { data: containerData },
        container: { data: containerData },
        previousIndex: 0,
        currentIndex: 1,
      } as unknown as CdkDragDrop<Ticket[]>;

      component.onDrop(mockEvent, TicketStatus.IN_PROGRESS);

      expect(component.inProgressTickets()[0].id).toBe('2');
      expect(component.inProgressTickets()[1].id).toBe('1');
    });

    it('should update doneTickets signal when swapped in same container', () => {
      const mockTickets: Partial<Ticket>[] = [
        { id: '1', title: 'T1', status: TicketStatus.DONE },
        { id: '2', title: 'T2', status: TicketStatus.DONE },
      ];
      mockTicketService.ticketsResource.value.set(mockTickets as Ticket[]);
      fixture.detectChanges();

      const containerData = component.doneTickets();
      const mockEvent = {
        previousContainer: { data: containerData },
        container: { data: containerData },
        previousIndex: 0,
        currentIndex: 1,
      } as unknown as CdkDragDrop<Ticket[]>;

      component.onDrop(mockEvent, TicketStatus.DONE);

      expect(component.doneTickets()[0].id).toBe('2');
      expect(component.doneTickets()[1].id).toBe('1');
    });

    it('should not swap if previousIndex equals currentIndex in same container', () => {
      const mockTickets: Partial<Ticket>[] = [
        { id: '1', title: 'T1', status: TicketStatus.TODO },
        { id: '2', title: 'T2', status: TicketStatus.TODO },
      ];
      mockTicketService.ticketsResource.value.set(mockTickets as Ticket[]);
      fixture.detectChanges();

      const containerData = component.todoTickets();
      const mockEvent = {
        previousContainer: { data: containerData },
        container: { data: containerData },
        previousIndex: 0,
        currentIndex: 0,
      } as unknown as CdkDragDrop<Ticket[]>;

      component.onDrop(mockEvent, TicketStatus.TODO);

      // Order unchanged
      expect(component.todoTickets()[0].id).toBe('1');
      expect(component.todoTickets()[1].id).toBe('2');
    });

    it('should log error when updateTicket fails on cross-container drop', () => {
      mockTicketService.updateTicket.mockReturnValue(throwError(() => new Error('Network error')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockEvent = {
        previousContainer: { data: [{ id: '1', status: TicketStatus.TODO }] },
        container: { data: [] },
        previousIndex: 0,
        currentIndex: 0,
      } as unknown as CdkDragDrop<Ticket[]>;

      component.onDrop(mockEvent, TicketStatus.IN_PROGRESS);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update ticket status', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
