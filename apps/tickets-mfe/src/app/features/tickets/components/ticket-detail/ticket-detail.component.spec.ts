import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from "@ng-console/shared/data-access";
import { UserService } from "@ng-console/shared/data-access";
import { AuthService } from "@ng-console/shared/data-access";
import { TicketPriority, TicketStatus } from "@ng-console/shared/models";

interface MockTicketService {
  getTicket: Mock;
  updateTicket: Mock;
  deleteTicket: Mock;
  addComment: Mock;
  epicsResource: {
    value: ReturnType<typeof signal<unknown[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<unknown>>;
    reload: Mock;
  };
}

interface MockUserService {
  usersResource: {
    value: ReturnType<typeof signal<unknown[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<unknown>>;
    reload: Mock;
  };
}

describe('TicketDetailComponent', () => {
  let component: TicketDetailComponent;
  let fixture: ComponentFixture<TicketDetailComponent>;
  let mockTicketService: MockTicketService;
  let mockUserService: MockUserService;
  let mockAuthService: {
    currentUser: ReturnType<typeof signal<{ id?: string; role?: string } | null>>;
  };
  let mockRouter: Router;
  let mockRoute: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };

  beforeEach(async () => {
    mockTicketService = {
      getTicket: vi.fn(),
      updateTicket: vi.fn(),
      deleteTicket: vi.fn(),
      addComment: vi.fn(),
      epicsResource: {
        value: signal([]),
        isLoading: signal(false),
        error: signal(undefined),
        reload: vi.fn(),
      },
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

    mockRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        { provide: TicketService, useValue: mockTicketService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    }).compileComponents();

    mockRouter = TestBed.inject(Router);
    vi.spyOn(mockRouter, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit and loadTicket', () => {
    it('should load ticket successfully if ID is provided', () => {
      const mockTicket = { id: 1, title: 'T1', status: TicketStatus.TODO };
      mockTicketService.getTicket.mockReturnValue(of(mockTicket));

      fixture.detectChanges(); // calls ngOnInit

      expect(mockUserService.usersResource.reload).toHaveBeenCalled();
      expect(mockTicketService.epicsResource.reload).toHaveBeenCalled();
      expect(mockTicketService.getTicket).toHaveBeenCalledWith('1');
      expect(component.ticket()).toEqual(mockTicket);
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBe(false);
    });

    it('should handle getTicket error', () => {
      mockTicketService.getTicket.mockReturnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();

      expect(component.ticket()).toBeNull();
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBe(true);
    });

    it('should show error if no valid ID provided', () => {
      mockRoute.snapshot.paramMap.get.mockReturnValue(null);
      fixture.detectChanges();

      expect(mockTicketService.getTicket).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBe(true);
    });
  });

  describe('edit operations', () => {
    const mockTicket = {
      id: 1,
      title: 'T1',
      description: 'Desc',
      about: 'About',
      status: TicketStatus.TODO,
      priority: TicketPriority.HIGH,
      estimations: 5,
      assignedPersonId: 'user1',
      epic: { id: 10, name: 'Epic 1' },
    };

    beforeEach(() => {
      mockTicketService.getTicket.mockReturnValue(of(mockTicket));
      fixture.detectChanges();
    });

    it('should populate ticketModel when editTicket is called', () => {
      component.editTicket();
      expect(component.isEditing()).toBe(true);
      expect(component.ticketModel()).toEqual({
        title: 'T1',
        description: 'Desc',
        about: 'About',
        status: TicketStatus.TODO,
        priority: TicketPriority.HIGH,
        estimations: 5,
        assignedPersonId: 'user1',
        epicId: '10',
      });
    });

    it('should cancel edit', () => {
      component.isEditing.set(true);
      component.cancelEdit();
      expect(component.isEditing()).toBe(false);
    });

    it('should submit updated ticket properly', async () => {
      component.editTicket();
      component.ticketModel.set({
        title: 'Updated Title',
        description: 'Updated Desc',
        about: '',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        estimations: 10,
        assignedPersonId: '',
        epicId: '',
      });

      mockTicketService.updateTicket.mockReturnValue(of({}));

      fixture.detectChanges();
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await fixture.whenStable();

      expect(mockTicketService.updateTicket).toHaveBeenCalledWith(1, {
        title: 'Updated Title',
        description: 'Updated Desc',
        about: '',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        estimations: 10,
        assignedPersonId: undefined,
        epic: null,
      });

      expect(component.isEditing()).toBe(false);
      expect(component.ticket()?.title).toBe('Updated Title');
    });

    it('should not submit if form is invalid', async () => {
      component.editTicket();
      component.ticketModel.set({
        ...component.ticketModel(),
        title: '', // invalidates form
      });
      fixture.detectChanges();
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await fixture.whenStable();

      expect(mockTicketService.updateTicket).not.toHaveBeenCalled();
    });
  });

  describe('deleteTicket', () => {
    beforeEach(() => {
      mockTicketService.getTicket.mockReturnValue(of({ id: 1, title: 'T1' }));
      fixture.detectChanges();
    });

    it('should evaluate canDeleteTicket correctly', () => {
      expect(component.canDeleteTicket()).toBe(false); // default null user

      mockAuthService.currentUser.set({ role: 'user' });
      expect(component.canDeleteTicket()).toBe(false);

      mockAuthService.currentUser.set({ role: 'admin' });
      expect(component.canDeleteTicket()).toBe(true);

      mockAuthService.currentUser.set({ role: 'moderator' });
      expect(component.canDeleteTicket()).toBe(true);
    });

    it('should confirm and cancel delete correctly', () => {
      component.confirmDelete();
      expect(component.showDeleteConfirm()).toBe(true);

      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should call delete endpoint and navigate', () => {
      mockTicketService.deleteTicket.mockReturnValue(of(null));
      component.deleteTicket();

      expect(mockTicketService.deleteTicket).toHaveBeenCalledWith(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tickets']);
    });
  });

  describe('addComment', () => {
    beforeEach(() => {
      mockTicketService.getTicket.mockReturnValue(of({ id: 1, title: 'T1', comments: [] }));
      fixture.detectChanges();
    });

    it('should add comment and append to ticket', () => {
      const mockComment = { id: 100, text: 'New Comment' };
      mockTicketService.addComment.mockReturnValue(of(mockComment));

      component.newCommentText.set('New Comment');
      component.addComment();

      expect(mockTicketService.addComment).toHaveBeenCalledWith(1, 'New Comment');
      expect(component.ticket()?.comments).toEqual([mockComment]);
      expect(component.newCommentText()).toBe('');
    });
  });
});
