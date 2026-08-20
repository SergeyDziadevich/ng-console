import { signal, Component, WritableSignal, ChangeDetectionStrategy } from "@angular/core";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationsComponent } from './notifications.component';
import { NotificationsService } from "@ng-console/shared/data-access";
import { NotificationMessage } from "@ng-console/shared/models";
import { AuthService } from "@ng-console/shared/data-access";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class DummyLogin {}

describe('Notifications', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;
  let mockService: {
    messages: WritableSignal<NotificationMessage[]>;
    isOnline: WritableSignal<boolean>;
    sendNotification: Mock;
    dropConnection: Mock;
    reconnect: Mock;
    markAsRead: Mock;
  };

  beforeEach(async () => {
    mockService = {
      messages: signal([]),
      isOnline: signal(true),
      sendNotification: vi.fn(),
      dropConnection: vi.fn(),
      reconnect: vi.fn(),
      markAsRead: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        NotificationsComponent,
        RouterTestingModule.withRoutes([{ path: 'login', component: DummyLogin }]),
      ],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call sendNotification on service', () => {
    component.sendNotification('Test Title');
    expect(mockService.sendNotification).toHaveBeenCalledWith('Test Title');
  });

  it('should call dropConnection on service', () => {
    component.dropConnection();
    expect(mockService.dropConnection).toHaveBeenCalled();
  });

  it('should call reconnect on service', () => {
    component.reconnect();
    expect(mockService.reconnect).toHaveBeenCalled();
  });

  it('should call markAsRead on service', () => {
    component.markAsRead('123');
    expect(mockService.markAsRead).toHaveBeenCalledWith('123');
  });
});

describe('Notifications - Roles', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;
  let mockAuthService: { currentUser: WritableSignal<unknown> };

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [
        NotificationsComponent,
        RouterTestingModule.withRoutes([{ path: 'login', component: DummyLogin }]),
      ],
      providers: [
        { provide: NotificationsService, useValue: {
            messages: signal([]),
            isOnline: signal(true),
          } 
        },
        { provide: AuthService, useValue: mockAuthService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('isAdmin should be true if role is admin', () => {
    mockAuthService.currentUser.set({ role: 'admin' });
    expect(component.isAdmin()).toBe(true);
  });

  it('isAdmin should be false if role is not admin', () => {
    mockAuthService.currentUser.set({ role: 'user' });
    expect(component.isAdmin()).toBe(false);
  });

  it('isAdminOrModerator should be true if role is admin or moderator', () => {
    mockAuthService.currentUser.set({ role: 'admin' });
    expect(component.isAdminOrModerator()).toBe(true);
    
    mockAuthService.currentUser.set({ role: 'moderator' });
    expect(component.isAdminOrModerator()).toBe(true);
  });

  it('isAdminOrModerator should be false if role is neither admin nor moderator', () => {
    mockAuthService.currentUser.set({ role: 'user' });
    expect(component.isAdminOrModerator()).toBe(false);
  });
});
