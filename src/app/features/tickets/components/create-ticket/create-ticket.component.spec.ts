import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import { CreateTicketComponent } from './create-ticket.component';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../../../services/user-service';
import { TicketPriority, TicketStatus } from '../../models/ticket.model';

interface MockTicketService {
  epicsResource: { value: ReturnType<typeof signal<unknown[]>>, isLoading: ReturnType<typeof signal<boolean>>, error: ReturnType<typeof signal<unknown>>, reload: Mock };
  createTicket: Mock;
}

interface MockUserService {
  usersResource: { value: ReturnType<typeof signal<unknown[]>>, isLoading: ReturnType<typeof signal<boolean>>, error: ReturnType<typeof signal<unknown>>, reload: Mock };
}

describe('CreateTicketComponent', () => {
  let component: CreateTicketComponent;
  let fixture: ComponentFixture<CreateTicketComponent>;
  let mockTicketService: MockTicketService;
  let mockUserService: MockUserService;
  let mockRouter: Router;

  beforeEach(async () => {
    mockTicketService = {
      epicsResource: { value: signal([]), isLoading: signal(false), error: signal(undefined), reload: vi.fn() },
      createTicket: vi.fn()
    };

    mockUserService = {
      usersResource: { value: signal([]), isLoading: signal(false), error: signal(undefined), reload: vi.fn() }
    };

    await TestBed.configureTestingModule({
      imports: [CreateTicketComponent],
      providers: [
        { provide: TicketService, useValue: mockTicketService },
        { provide: UserService, useValue: mockUserService },
        provideRouter([])
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router);
    vi.spyOn(mockRouter, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(CreateTicketComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reload users and epics on init', () => {
    fixture.detectChanges();
    expect(mockUserService.usersResource.reload).toHaveBeenCalled();
    expect(mockTicketService.epicsResource.reload).toHaveBeenCalled();
  });

  describe('Form submission', () => {
    it('should not submit if form is invalid (missing title or description)', async () => {
      // By default, title and description are empty strings -> invalid
      fixture.detectChanges();
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await fixture.whenStable();

      expect(mockTicketService.createTicket).not.toHaveBeenCalled();
    });

    it('should submit form when valid and navigate to tickets list', async () => {
      component.ticketModel.set({
        title: 'Valid title',
        description: 'Valid description',
        about: '',
        status: TicketStatus.TODO,
        priority: TicketPriority.HIGH,
        assignedPersonId: '',
        epicId: '',
        estimations: null,
      });

      mockTicketService.createTicket.mockReturnValue(of({ id: 1, title: 'Valid title' }));

      fixture.detectChanges();
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await fixture.whenStable();

      expect(component.isSubmitting()).toBe(false);
      expect(component.showToast()).toBe(true);
      expect(mockTicketService.createTicket).toHaveBeenCalledWith({
        title: 'Valid title',
        description: 'Valid description',
        about: undefined,
        status: TicketStatus.TODO,
        priority: TicketPriority.HIGH,
        assignedPersonId: undefined,
        estimations: undefined,
        epic: undefined
      });

      await new Promise(resolve => setTimeout(resolve, 1600));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tickets']);
    });

    it('should handle API errors during submission', async () => {
      component.ticketModel.set({
        title: 'Valid title',
        description: 'Valid description',
        about: '',
        status: TicketStatus.TODO,
        priority: TicketPriority.HIGH,
        assignedPersonId: '',
        epicId: '',
        estimations: null,
      });

      mockTicketService.createTicket.mockReturnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await fixture.whenStable();

      expect(consoleSpy).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
