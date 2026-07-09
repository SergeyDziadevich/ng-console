import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { Dashboard } from './dashboard';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../features/tickets/services/ticket.service';
import { Ticket, TicketStatus } from '../tickets/models/ticket.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let authServiceMock: { currentUser: ReturnType<typeof signal<{ id: string } | null>> };
  let ticketServiceMock: {
    ticketsResource: {
      value: ReturnType<typeof signal<Ticket[] | undefined>>;
      reload: ReturnType<typeof vi.fn>;
      isLoading: ReturnType<typeof signal<boolean>>;
    };
  };

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal(null),
    };

    ticketServiceMock = {
      ticketsResource: {
        value: signal(undefined),
        reload: vi.fn(),
        isLoading: signal(false),
      },
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([{ path: '**', component: Dashboard }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: TicketService, useValue: ticketServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call reload on ticketsResource', () => {
      fixture.detectChanges(); // Triggers ngOnInit
      expect(ticketServiceMock.ticketsResource.reload).toHaveBeenCalled();
    });
  });

  describe('Computed Signals', () => {
    const mockTickets: Partial<Ticket>[] = [
      { id: 1, status: TicketStatus.TODO, assignedPersonId: 'user1' },
      { id: 2, status: TicketStatus.IN_PROGRESS, assignedPersonId: 'user1' },
      { id: 3, status: TicketStatus.DONE, assignedPersonId: 'user2' },
      { id: 4, status: TicketStatus.IN_PROGRESS, assignedPersonId: 'user2' },
    ];

    beforeEach(() => {
      ticketServiceMock.ticketsResource.value.set(mockTickets as Ticket[]);
    });

    it('should calculate total tickets', () => {
      expect(component.totalTickets()).toBe(4);
    });

    it('should filter inProgressTickets', () => {
      expect(component.inProgressTickets().length).toBe(2);
      expect(component.inProgressTicketsCount()).toBe(2);
    });

    it('should filter doneTickets', () => {
      expect(component.doneTickets().length).toBe(1);
      expect(component.doneTicketsCount()).toBe(1);
    });

    it('should count todoTickets', () => {
      expect(component.todoTicketsCount()).toBe(1);
    });

    it('should count assignedTicketsCount for current user', () => {
      authServiceMock.currentUser.set({ id: 'user1' });
      expect(component.assignedTicketsCount()).toBe(2);

      authServiceMock.currentUser.set({ id: 'user2' });
      expect(component.assignedTicketsCount()).toBe(2);

      authServiceMock.currentUser.set({ id: 'user3' });
      expect(component.assignedTicketsCount()).toBe(0);
    });

    it('should handle undefined ticketsResource for counting', () => {
      ticketServiceMock.ticketsResource.value.set(undefined);
      expect(component.totalTickets()).toBe(0);
      expect(component.inProgressTicketsCount()).toBe(0);
      expect(component.doneTicketsCount()).toBe(0);
      expect(component.todoTicketsCount()).toBe(0);

      authServiceMock.currentUser.set({ id: 'user1' });
      expect(component.assignedTicketsCount()).toBe(0);
    });

    it('should generate correct ticketChartGradient', () => {
      // Todo: 1, In Progress: 2, Done: 1 -> Total 4
      // TodoPct: 25, InProgressPct: 50, DonePct: 25
      const gradient = component.ticketChartGradient();
      expect(gradient).toBe('conic-gradient(#9ca3af 0% 25%, #3b82f6 25% 75%, #22c55e 75% 100%)');
    });

    it('should generate default ticketChartGradient when total is 0', () => {
      ticketServiceMock.ticketsResource.value.set([]);
      const gradient = component.ticketChartGradient();
      expect(gradient).toBe('conic-gradient(#f3f4f6 100%, transparent 0)');
    });
  });
});
