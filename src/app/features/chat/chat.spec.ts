import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';

import { Chat } from './chat';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { ChatRoom, ChatMessage } from '../../models/chat.model';

describe('Chat Component', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;
  let chatService: ChatService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{path: 'login', component: Chat}])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle create room form state', () => {
    expect(component.isCreatingRoom()).toBe(false);
    
    component.toggleCreateRoom();
    expect(component.isCreatingRoom()).toBe(true);
    
    component.toggleCreateRoom();
    expect(component.isCreatingRoom()).toBe(false);
  });

  it('should reset new room form when closing', () => {
    component.newRoomName.set('Test Room');
    component.selectedUserIds.set(['user1']);
    
    // Toggle to open
    component.toggleCreateRoom();
    // Toggle to close, should reset
    component.toggleCreateRoom();

    expect(component.newRoomName()).toBe('');
    expect(component.selectedUserIds()).toEqual([]);
  });

  it('should toggle user selection for new room', () => {
    expect(component.selectedUserIds()).toEqual([]);
    
    component.toggleUserSelection('user1');
    expect(component.selectedUserIds()).toEqual(['user1']);
    
    component.toggleUserSelection('user2');
    expect(component.selectedUserIds()).toEqual(['user1', 'user2']);
    
    component.toggleUserSelection('user1');
    expect(component.selectedUserIds()).toEqual(['user2']);
  });

  it('should select room using ChatService', () => {
    vi.spyOn(chatService, 'selectRoom');
    component.selectRoom('room1');
    expect(chatService.selectRoom).toHaveBeenCalledWith('room1');
  });

  it('should send a message using ChatService', () => {
    vi.spyOn(chatService, 'activeRoomId').mockReturnValue('room1');
    vi.spyOn(chatService, 'sendMessage');
    
    component.newMessage.set('Hello World');
    component.sendMessage();
    
    expect(chatService.sendMessage).toHaveBeenCalledWith('room1', 'Hello World');
    expect(component.newMessage()).toBe('');
  });

  it('should not send message if content is empty', () => {
    vi.spyOn(chatService, 'activeRoomId').mockReturnValue('room1');
    vi.spyOn(chatService, 'sendMessage');
    
    component.newMessage.set('   ');
    component.sendMessage();
    
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should not send message if no active room', () => {
    vi.spyOn(chatService, 'activeRoomId').mockReturnValue(null);
    vi.spyOn(chatService, 'sendMessage');
    
    component.newMessage.set('Hello World');
    component.sendMessage();
    
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should create room using ChatService', () => {
    const mockRoom = { id: 'room1', name: 'Test Room', members: [], createdAt: new Date(), updatedAt: new Date() };
    vi.spyOn(chatService, 'createRoom').mockReturnValue(of(mockRoom as unknown as ChatRoom));
    vi.spyOn(chatService, 'fetchRooms');
    vi.spyOn(component, 'selectRoom');

    component.newRoomName.set('Test Room');
    component.selectedUserIds.set(['user1', 'user2']);
    
    // Assume it was toggled open
    component.isCreatingRoom.set(true);

    component.createRoom();

    expect(chatService.createRoom).toHaveBeenCalledWith('Test Room', ['user1', 'user2']);
    expect(chatService.fetchRooms).toHaveBeenCalled();
    expect(component.isCreatingRoom()).toBe(false); // toggled close
    expect(component.selectRoom).toHaveBeenCalledWith('room1');
  });

  it('should not create room if name is empty or no users selected', () => {
    vi.spyOn(chatService, 'createRoom');

    // Name empty
    component.newRoomName.set('   ');
    component.selectedUserIds.set(['user1']);
    component.createRoom();
    expect(chatService.createRoom).not.toHaveBeenCalled();

    // No users
    component.newRoomName.set('Test Room');
    component.selectedUserIds.set([]);
    component.createRoom();
    expect(chatService.createRoom).not.toHaveBeenCalled();
  });

  it('should toggle add user form state', () => {
    expect(component.isAddingUser()).toBe(false);
    
    component.toggleAddUser();
    expect(component.isAddingUser()).toBe(true);
    
    component.toggleAddUser();
    expect(component.isAddingUser()).toBe(false);
  });

  describe('availableUsersToAdd', () => {
    it('should return empty if no active room', () => {
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue(null);
      expect(component.availableUsersToAdd()).toEqual([]);
    });

    it('should return empty if active room is not in rooms list', () => {
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('1');
      vi.spyOn(chatService, 'rooms').mockReturnValue([]);
      expect(component.availableUsersToAdd()).toEqual([]);
    });

    it('should filter out users that are already in the active room', () => {
      const room = { id: '1', members: [{ userId: 'u1' }] } as unknown as ChatRoom;
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('1');
      vi.spyOn(chatService, 'rooms').mockReturnValue([room]);
      
      const mockUsers = [{ _id: 'u1', username: 'user1' }, { _id: 'u2', username: 'user2' }];
      vi.spyOn(component.userService.usersResource, 'value').mockReturnValue(mockUsers as any);
      
      expect(component.availableUsersToAdd()).toEqual([mockUsers[1]] as any);
    });

    it('should filter by search query', () => {
      const room = { id: '1', members: [] } as unknown as ChatRoom;
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('1');
      vi.spyOn(chatService, 'rooms').mockReturnValue([room]);
      
      const mockUsers = [
        { _id: 'u1', username: 'apple' }, 
        { _id: 'u2', username: 'banana', displayName: 'Banana Split' },
        { _id: 'u3', username: 'cherry' }
      ];
      vi.spyOn(component.userService.usersResource, 'value').mockReturnValue(mockUsers as any);
      
      component.userSearchQuery.set('BANANA');
      expect(component.availableUsersToAdd()).toEqual([mockUsers[1]] as any);
    });
  });

  describe('toggleAddUserSelection', () => {
    it('should add and remove user from selectedUsersToAdd', () => {
      expect(component.selectedUsersToAdd()).toEqual([]);
      component.toggleAddUserSelection('u1');
      expect(component.selectedUsersToAdd()).toEqual(['u1']);
      component.toggleAddUserSelection('u1');
      expect(component.selectedUsersToAdd()).toEqual([]);
    });
  });

  describe('addUsersToRoom', () => {
    it('should not call addMembers if no active room or no users selected', () => {
      vi.spyOn(chatService, 'addMembers');
      
      component.selectedUsersToAdd.set([]);
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('1');
      component.addUsersToRoom();
      expect(chatService.addMembers).not.toHaveBeenCalled();

      component.selectedUsersToAdd.set(['u1']);
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue(null);
      component.addUsersToRoom();
      expect(chatService.addMembers).not.toHaveBeenCalled();
    });

    it('should call addMembers and handle success', () => {
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('1');
      vi.spyOn(chatService, 'addMembers').mockReturnValue(of({} as ChatRoom));
      vi.spyOn(chatService, 'fetchRooms');
      vi.spyOn(component, 'toggleAddUser');

      component.selectedUsersToAdd.set(['u1', 'u2']);
      component.addUsersToRoom();

      expect(chatService.addMembers).toHaveBeenCalledWith('1', ['u1', 'u2']);
      expect(chatService.fetchRooms).toHaveBeenCalled();
      expect(component.toggleAddUser).toHaveBeenCalled();
    });

    it('should call addMembers and log error on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('1');
      vi.spyOn(chatService, 'addMembers').mockReturnValue(throwError(() => new Error('test')));
      
      component.selectedUsersToAdd.set(['u1']);
      component.addUsersToRoom();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add members to room', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('createRoom error handling', () => {
    it('should handle error from chatService.createRoom', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(chatService, 'createRoom').mockReturnValue(throwError(() => new Error('test')));
      
      component.newRoomName.set('Test');
      component.selectedUserIds.set(['u1']);
      component.isCreatingRoom.set(true);
      component.createRoom();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create room', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('resetAddUserForm', () => {
    it('should reset userSearchQuery and selectedUsersToAdd', () => {
      component.userSearchQuery.set('test');
      component.selectedUsersToAdd.set(['u1']);
      component.resetAddUserForm();
      expect(component.userSearchQuery()).toBe('');
      expect(component.selectedUsersToAdd()).toEqual([]);
    });

    it('should be called when toggleAddUser closes the modal', () => {
      vi.spyOn(component, 'resetAddUserForm');
      component.isAddingUser.set(true); // Open
      component.toggleAddUser(); // Close
      expect(component.resetAddUserForm).toHaveBeenCalled();
    });
  });

  describe('isMessageRead', () => {
    const mockMessage = { id: 'm1', roomId: '1', createdAt: '2023-01-01T10:00:00Z' } as ChatMessage;

    beforeEach(() => {
      const authService = TestBed.inject(AuthService);
      // @ts-expect-error mocking currentUser property for tests
      authService.currentUser = signal({ id: 'u_curr' });
    });

    it('should return false if room is not found', () => {
      vi.spyOn(chatService, 'rooms').mockReturnValue([]);
      expect(component.isMessageRead(mockMessage)).toBe(false);
    });

    it('should return false if room has no members', () => {
      vi.spyOn(chatService, 'rooms').mockReturnValue([{ id: '1' } as ChatRoom]);
      expect(component.isMessageRead(mockMessage)).toBe(false);
    });

    it('should return false if no other members in room', () => {
      vi.spyOn(chatService, 'rooms').mockReturnValue([{ 
        id: '1', members: [{ userId: 'u_curr' }] 
      } as unknown as ChatRoom]);
      expect(component.isMessageRead(mockMessage)).toBe(false);
    });

    it('should return false if other members have not read', () => {
      vi.spyOn(chatService, 'rooms').mockReturnValue([{ 
        id: '1', members: [
          { userId: 'u_curr' },
          { userId: 'u_other', lastReadAt: '2022-01-01T10:00:00Z' } // before message
        ] 
      } as unknown as ChatRoom]);
      expect(component.isMessageRead(mockMessage)).toBe(false);
    });

    it('should return true if any other member has read', () => {
      vi.spyOn(chatService, 'rooms').mockReturnValue([{ 
        id: '1', members: [
          { userId: 'u_curr' },
          { userId: 'u_other', lastReadAt: '2023-01-01T11:00:00Z' } // after message
        ] 
      } as unknown as ChatRoom]);
      expect(component.isMessageRead(mockMessage)).toBe(true);
    });
  });
});
