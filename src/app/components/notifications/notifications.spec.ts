import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Notifications } from './notifications';
import { io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

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

describe('Notifications', () => {
  let component: Notifications;
  let fixture: ComponentFixture<Notifications>;
  let mockSocket: any;
  let globalFetchMock: Mock;

  beforeEach(async () => {
    globalFetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', globalFetchMock);

    await TestBed.configureTestingModule({
      imports: [Notifications],
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    component = fixture.componentInstance;
    
    fixture.detectChanges(); // triggers ngOnInit
    mockSocket = (io as Mock).mock.results[0].value;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(io).toHaveBeenCalledWith(environment.apiUrl, expect.any(Object));
  });

  it('should handle connect event', () => {
    const connectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'connect')[1];
    connectHandler();
    expect(component.isOnline()).toBe(true);
  });

  it('should handle disconnect event', () => {
    component.isOnline.set(true);
    const disconnectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'disconnect')[1];
    disconnectHandler();
    expect(component.isOnline()).toBe(false);
  });

  it('should handle notification event', () => {
    const notifHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'notification')[1];
    
    mockSocket.recovered = true;
    notifHandler({ title: 'Test Notif', id: '1', body: 'body', ts: 123 });
    
    expect(component.messages().length).toBe(1);
    expect(component.messages()[0]).toEqual({
      title: 'Test Notif',
      replayed: true
    });
  });

  it('should call fetch on sendNotification', () => {
    component.sendNotification('My Title');
    expect(globalFetchMock).toHaveBeenCalledWith(`${environment.apiUrl}/api/notifications/notify`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'My Title' })
    }));
  });

  it('should drop connection and add system message', () => {
    component.dropConnection();
    expect(mockSocket.io.engine.close).toHaveBeenCalled();
    expect(component.messages()[0].title).toContain('dropped');
    expect(component.messages()[0].isSystem).toBe(true);
  });

  it('should reconnect on reconnect call', () => {
    component.reconnect();
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('should disconnect on destroy', () => {
    component.ngOnDestroy();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
