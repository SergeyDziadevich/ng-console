import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationsService, NotificationPayload } from './notifications.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { io } from 'socket.io-client';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { signal } from '@angular/core';

vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    io: {
      engine: {
        close: vi.fn(),
      },
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    recovered: false,
  };
  return {
    io: vi.fn(() => mockSocket),
    Socket: vi.fn(),
  };
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: { currentUser: import('@angular/core').WritableSignal<{ id: string, name: string } | null> };
  let mockSocket: {
    on: Mock;
    io: { engine: { close: Mock } };
    connect: Mock;
    disconnect: Mock;
    recovered: boolean;
  };

  beforeEach(() => {
    authServiceMock = {
      currentUser: signal({ id: 'user-123', name: 'Test User' })
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
      ]
    });

    service = TestBed.inject(NotificationsService);
    httpTestingController = TestBed.inject(HttpTestingController);
    mockSocket = (io as Mock).mock.results[0]?.value;
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.clearAllMocks();
  });

  it('should initialize and fetch history', () => {
    expect(service).toBeTruthy();

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    expect(req.request.method).toBe('GET');

    const mockHistory: NotificationPayload[] = [
      { id: '1', title: 'Test 1', body: 'Body 1', ts: 1000, isRead: false },
      { id: '2', title: 'Test 2', body: 'Body 2', ts: 2000, isRead: true }
    ];
    req.flush(mockHistory);

    expect(service.messages().length).toBe(2);
    expect(service.unreadCount()).toBe(1);
    expect(service.messages()[0].title).toBe('Test 1');
  });

  it('should handle incoming socket connection events', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    req.flush([]);

    // Find the 'connect' handler and call it
    const connectHandler = mockSocket.on.mock.calls.find((c: unknown[]) => c[0] === 'connect')![1];
    connectHandler();

    expect(service.isOnline()).toBe(true);

    // Find the 'disconnect' handler and call it
    const disconnectHandler = mockSocket.on.mock.calls.find((c: unknown[]) => c[0] === 'disconnect')![1];
    disconnectHandler();

    expect(service.isOnline()).toBe(false);
  });

  it('should handle incoming notifications', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    req.flush([]);

    const notifHandler = mockSocket.on.mock.calls.find((c: unknown[]) => c[0] === 'notification')![1];
    mockSocket.recovered = false;
    notifHandler({ id: 'new-1', title: 'New Notif', body: 'New Body', ts: 3000, isSystem: false });

    expect(service.messages().length).toBe(1);
    expect(service.messages()[0].id).toBe('new-1');
    expect(service.messages()[0].title).toBe('New Notif');
    expect(service.messages()[0].replayed).toBe(false);
    expect(service.messages()[0].isRead).toBe(false);
  });

  it('should handle replayed notifications', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    req.flush([]);

    const notifHandler = mockSocket.on.mock.calls.find((c: unknown[]) => c[0] === 'notification')![1];
    mockSocket.recovered = true;
    notifHandler({ id: 'replayed-1', title: 'Replayed Notif', body: 'Body', ts: 4000 });

    expect(service.messages()[0].replayed).toBe(true);
  });

  it('should prevent duplicate notifications by id', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    req.flush([{ id: 'existing-1', title: 'Existing', body: 'Body', ts: 1000 }]);

    const notifHandler = mockSocket.on.mock.calls.find((c: unknown[]) => c[0] === 'notification')![1];
    notifHandler({ id: 'existing-1', title: 'Existing Duplicate', body: 'Body', ts: 1000 });

    // Length should still be 1
    expect(service.messages().length).toBe(1);
  });

  it('should send notification via http', () => {
    const reqInit = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    reqInit.flush([]);

    service.sendNotification('Test Outgoing');

    const reqPost = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications/notify`);
    expect(reqPost.request.method).toBe('POST');
    expect(reqPost.request.body).toEqual({
      title: 'Test Outgoing',
      type: 'info',
      userId: 'user-123'
    });
    reqPost.flush({});
  });

  it('should not send notification if user is not logged in', () => {
    const reqInit = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    reqInit.flush([]);

    authServiceMock.currentUser.set(null);
    service.sendNotification('Test Outgoing');

    httpTestingController.expectNone(`${environment.apiUrl}/api/notifications/notify`);
  });

  it('should mark notification as read', () => {
    const reqInit = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    reqInit.flush([{ id: 'msg-1', title: 'Message', body: 'Body', ts: 1000, isRead: false }]);

    expect(service.unreadCount()).toBe(1);

    service.markAsRead('msg-1');

    const reqPost = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications/msg-1/read`);
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({});

    expect(service.unreadCount()).toBe(0);
    expect(service.messages()[0].isRead).toBe(true);
  });

  it('should ignore markAsRead for system notifications or missing id', () => {
    const reqInit = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    reqInit.flush([]);

    service.markAsRead('');
    service.markAsRead('sys-123');

    httpTestingController.expectNone(`${environment.apiUrl}/api/notifications/sys-123/read`);
  });

  it('should drop connection and prepend system message', () => {
    const reqInit = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    reqInit.flush([]);

    service.dropConnection();

    expect(mockSocket.io.engine.close).toHaveBeenCalled();
    expect(service.messages().length).toBe(1);
    expect(service.messages()[0].id.startsWith('sys-dropped')).toBe(true);
    expect(service.messages()[0].isSystem).toBe(true);
  });

  it('should reconnect socket', () => {
    const reqInit = httpTestingController.expectOne(`${environment.apiUrl}/api/notifications`);
    reqInit.flush([]);

    service.reconnect();
    expect(mockSocket.connect).toHaveBeenCalled();
  });
});
