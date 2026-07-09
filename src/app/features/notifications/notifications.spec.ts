import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Notifications } from './notifications';
import { NotificationsService, NotificationMessage } from '../../services/notifications.service';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { signal, Component, WritableSignal } from '@angular/core';

@Component({ template: '' })
class DummyLogin {}

describe('Notifications', () => {
  let component: Notifications;
  let fixture: ComponentFixture<Notifications>;
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
        Notifications,
        RouterTestingModule.withRoutes([{ path: 'login', component: DummyLogin }]),
      ],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
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
});
