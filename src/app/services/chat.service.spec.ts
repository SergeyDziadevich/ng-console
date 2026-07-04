import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { ChatService } from './chat.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { ChatRoom, ChatMessage } from '../models/chat.model';

import { io } from 'socket.io-client';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn()
};

vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(() => mockSocket),
    Socket: vi.fn()
  };
});

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    getToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
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
    it('should connect to socket and fetch rooms when connect() is called explicitly', () => {
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

    it('should disconnect from socket', () => {
      service.connect();
      service.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isOnline()).toBe(false);
    });
  });

  describe('HTTP calls', () => {
    const timestamp = new Date().toISOString();

    it('should fetch rooms', () => {
      const mockRooms: ChatRoom[] = [{ id: '1', name: 'Room 1', hasUnread: false, createdAt: timestamp, updatedAt: timestamp }];
      service.fetchRooms();
      
      // we expect a GET request containing ?_t=
      const req = httpMock.expectOne(req => req.url.includes(`${environment.apiUrl}/api/chats/rooms?_t=`) && req.method === 'GET');
      req.flush(mockRooms);
      
      expect(service.rooms()).toEqual(mockRooms);
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
    it('should set active room, clear old messages, fetch new messages, and mark as read', () => {
      const mockMessages: ChatMessage[] = [{ id: '100', roomId: '1', senderId: 'u1', content: 'hello', createdAt: '2023' }];
      
      // connect to initialize the socket so markAsRead can fire
      service.connect();
      
      // Set online manually since socket.on('connect') callback won't auto-run
      service['isOnline'].set(true); 

      service.selectRoom('1');
      expect(service.activeRoomId()).toBe('1');
      expect(mockSocket.emit).toHaveBeenCalledWith('markAsRead', { roomId: '1' });

      const req = httpMock.expectOne(req => req.url.includes(`${environment.apiUrl}/api/chats/rooms/1/messages?_t=`) && req.method === 'GET');
      req.flush(mockMessages);

      expect(service.activeRoomMessages()).toEqual(mockMessages);
    });
  });

  describe('sendMessage', () => {
    it('should emit sendMessage if connected', () => {
      service.connect();
      service['isOnline'].set(true); 
      service.sendMessage('1', 'Test content');
      expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', { roomId: '1', content: 'Test content' });
    });

    it('should not emit if disconnected', () => {
      service.sendMessage('1', 'Test content');
      expect(mockSocket.emit).not.toHaveBeenCalledWith('sendMessage', expect.any(Object));
    });
  });
});
