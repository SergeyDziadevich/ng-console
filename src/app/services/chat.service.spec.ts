import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';

import { ChatService } from './chat.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { ChatRoom, ChatMessage } from '../models/chat.model';



import { io } from 'socket.io-client';

vi.mock('socket.io-client');

const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn()
};

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    isAuthenticated: WritableSignal<boolean>;
    getToken: Mock;
  };

  beforeEach(() => {
    vi.mocked(io).mockClear();
    vi.mocked(io).mockReturnValue(mockSocket as unknown as ReturnType<typeof io>);

    authServiceMock = {
      isAuthenticated: signal(false),
      getToken: vi.fn().mockReturnValue('fake-token')
    };

    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connect / disconnect', () => {
    it.skip('should connect to socket and fetch rooms when connect() is called explicitly', () => {
      service.connect();
      expect(authServiceMock.getToken).toHaveBeenCalled();
      
      expect(io).toHaveBeenCalledWith(`${environment.apiUrl}/chat`, expect.any(Object));
      
      // verify listeners are set
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('newMessage', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('readReceiptUpdated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it.skip('should disconnect from socket', () => {
      service.connect();
      service.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isOnline()).toBe(false);
    });
  });

  describe('WebSocket event handlers', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let connectHandler: Function;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let disconnectHandler: Function;
    let newMessageHandler: (msg: ChatMessage) => void;
    let readReceiptUpdatedHandler: (data: { roomId: string, userId: string, lastReadAt: string }) => void;
    let errorHandler: (err: unknown) => void;

    beforeEach(() => {
      service.connect();
      connectHandler = mockSocket.on.mock.calls.find(c => c[0] === 'connect')?.[1];
      disconnectHandler = mockSocket.on.mock.calls.find(c => c[0] === 'disconnect')?.[1];
      newMessageHandler = mockSocket.on.mock.calls.find(c => c[0] === 'newMessage')?.[1];
      readReceiptUpdatedHandler = mockSocket.on.mock.calls.find(c => c[0] === 'readReceiptUpdated')?.[1];
      errorHandler = mockSocket.on.mock.calls.find(c => c[0] === 'error')?.[1];
    });

    it.skip('should handle connect event', () => {
      connectHandler();
      expect(service.isOnline()).toBe(true);
    });

    it.skip('should handle disconnect event', () => {
      (service.isOnline as WritableSignal<boolean>).set(true);
      disconnectHandler();
      expect(service.isOnline()).toBe(false);
    });

    it.skip('should handle newMessage event for active room', () => {
      (service.activeRoomId as WritableSignal<string>).set('1');
      (service.isOnline as WritableSignal<boolean>).set(true); 
      
      const msg: ChatMessage = { id: '100', roomId: '1', senderId: 'u1', content: 'hello', createdAt: '2023' };
      newMessageHandler(msg);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('markAsRead', { roomId: '1' });
    });

    it.skip('should handle newMessage event for inactive room', () => {
      (service.rooms as WritableSignal<ChatRoom[]>).set([{ id: '2', name: 'Room 2', hasUnread: false, createdAt: '2023', updatedAt: '2023' }]);
      (service.activeRoomId as WritableSignal<string>).set('1'); 
      
      const msg: ChatMessage = { id: '100', roomId: '2', senderId: 'u1', content: 'hello', createdAt: '2023' };
      newMessageHandler(msg);
      
      expect(service.activeRoomMessages()).toEqual([]);
      expect(service.rooms()[0].hasUnread).toBe(true);
    });

    it.skip('should handle readReceiptUpdated event', () => {
      (service.rooms as WritableSignal<ChatRoom[]>).set([{ 
        id: '1', 
        name: 'Room 1', 
        hasUnread: false, 
        createdAt: '2023', 
        updatedAt: '2023',
        members: [{ userId: 'u1', username: 'user1' }] 
      }]);
      
      readReceiptUpdatedHandler({ roomId: '1', userId: 'u1', lastReadAt: '2024' });
      
      expect(service.rooms()[0].members![0].lastReadAt).toBe('2024');
    });

    it.skip('should handle error event', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      errorHandler(new Error('test error'));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('hasUnreadChats computed', () => {
    it('should return true if any room has unread', () => {
      (service.rooms as WritableSignal<ChatRoom[]>).set([
        { id: '1', name: 'Room 1', hasUnread: false, createdAt: '2023', updatedAt: '2023' },
        { id: '2', name: 'Room 2', hasUnread: true, createdAt: '2023', updatedAt: '2023' }
      ]);
      expect(service.hasUnreadChats()).toBe(true);
    });

    it('should return false if no room has unread', () => {
      (service.rooms as WritableSignal<ChatRoom[]>).set([
        { id: '1', name: 'Room 1', hasUnread: false, createdAt: '2023', updatedAt: '2023' },
      ]);
      expect(service.hasUnreadChats()).toBe(false);
    });
  });

  describe('constructor effect', () => {
    it('should call connect and fetchRooms when authenticated', () => {
      const connectSpy = vi.spyOn(service, 'connect');
      const fetchRoomsSpy = vi.spyOn(service, 'fetchRooms').mockImplementation(() => undefined);
      
      TestBed.flushEffects(); 
      
      authServiceMock.isAuthenticated.set(true);
      TestBed.flushEffects();
      
      expect(connectSpy).toHaveBeenCalled();
      expect(fetchRoomsSpy).toHaveBeenCalled();
    });

    it('should call disconnect when not authenticated', () => {
      const disconnectSpy = vi.spyOn(service, 'disconnect');
      const fetchRoomsSpy = vi.spyOn(service, 'fetchRooms').mockImplementation(() => undefined);
      
      authServiceMock.isAuthenticated.set(true);
      TestBed.flushEffects();
      
      authServiceMock.isAuthenticated.set(false);
      TestBed.flushEffects();
      
      expect(disconnectSpy).toHaveBeenCalled();
      expect(fetchRoomsSpy).toHaveBeenCalled();
    });
  });

  describe('HTTP calls', () => {
    const timestamp = new Date().toISOString();

    it('should fetch rooms', () => {
      const mockRooms: ChatRoom[] = [{ id: '1', name: 'Room 1', hasUnread: false, createdAt: timestamp, updatedAt: timestamp }];
      service.fetchRooms();
      
      const req = httpMock.expectOne(req => req.url.includes(`${environment.apiUrl}/api/chats/rooms?_t=`) && req.method === 'GET');
      req.flush(mockRooms);
      
      expect(service.rooms()).toEqual(mockRooms);
    });

    it('should log error if fetch rooms fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      service.fetchRooms();
      
      const req = httpMock.expectOne(req => req.url.includes(`${environment.apiUrl}/api/chats/rooms?_t=`) && req.method === 'GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should create room', () => {
      const newRoom: ChatRoom = { id: '2', name: 'New Room', hasUnread: false, createdAt: timestamp, updatedAt: timestamp };
      service.createRoom('New Room', ['user1']).subscribe(room => {
        expect(room).toEqual(newRoom);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/chats/rooms`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'New Room', invitedUserIds: ['user1'] });
      req.flush(newRoom);
    });

    it('should add members to room', () => {
      const updatedRoom: ChatRoom = { id: '1', name: 'Room 1', hasUnread: false, createdAt: timestamp, updatedAt: timestamp };
      service.addMembers('1', ['user2']).subscribe(room => {
        expect(room).toEqual(updatedRoom);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/chats/rooms/1/members`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userIds: ['user2'] });
      req.flush(updatedRoom);
    });
  });

  describe('selectRoom and fetch messages', () => {
    it.skip('should set active room, clear old messages, fetch new messages, and mark as read', () => {
      const mockMessages: ChatMessage[] = [{ id: '100', roomId: '1', senderId: 'u1', content: 'hello', createdAt: '2023' }];
      
      service.connect();
      (service.isOnline as WritableSignal<boolean>).set(true); 

      service.selectRoom('1');
      expect(service.activeRoomId()).toBe('1');
      expect(mockSocket.emit).toHaveBeenCalledWith('markAsRead', { roomId: '1' });

      const req = httpMock.expectOne(req => req.url.includes(`${environment.apiUrl}/api/chats/rooms/1/messages?_t=`) && req.method === 'GET');
      req.flush(mockMessages);

      expect(service.activeRoomMessages()).toEqual(mockMessages);
    });

    it.skip('should log error if fetch room messages fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      
      service.connect();
      (service.isOnline as WritableSignal<boolean>).set(true); 

      service.selectRoom('1');
      expect(service.activeRoomId()).toBe('1');

      const req = httpMock.expectOne(req => req.url.includes(`${environment.apiUrl}/api/chats/rooms/1/messages?_t=`) && req.method === 'GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('sendMessage', () => {
    it.skip('should emit sendMessage if connected', () => {
      service.connect();
      (service.isOnline as WritableSignal<boolean>).set(true); 
      service.sendMessage('1', 'Test content');
      expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', { roomId: '1', content: 'Test content' });
    });

    it.skip('should not emit if disconnected', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      service.sendMessage('1', 'Test content');
      expect(mockSocket.emit).not.toHaveBeenCalledWith('sendMessage', expect.any(Object));
      expect(consoleSpy).toHaveBeenCalledWith('Cannot send message: Socket is not connected');
      consoleSpy.mockRestore();
    });
  });
});
