import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';

import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { ChatRoom, ChatMessage } from '../../models/chat.model';
import { User } from '../../models/user.model';

describe('Chat Component', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatService: ChatService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: ChatComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
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
    const mockRoom = {
      id: 'room1',
      name: 'Test Room',
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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

      const mockUsers = [
        { _id: 'u1', username: 'user1' },
        { _id: 'u2', username: 'user2' },
      ];
      vi.spyOn(component.userService.usersResource, 'value').mockReturnValue(
        mockUsers as unknown as User[],
      );

      expect(component.availableUsersToAdd()).toEqual([mockUsers[1]] as unknown as User[]);
    });

    it('should filter by search query', () => {
      const room = { id: '1', members: [] } as unknown as ChatRoom;
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('1');
      vi.spyOn(chatService, 'rooms').mockReturnValue([room]);

      const mockUsers = [
        { _id: 'u1', username: 'apple' },
        { _id: 'u2', username: 'banana', displayName: 'Banana Split' },
        { _id: 'u3', username: 'cherry' },
      ];
      vi.spyOn(component.userService.usersResource, 'value').mockReturnValue(
        mockUsers as unknown as User[],
      );

      component.userSearchQuery.set('BANANA');
      expect(component.availableUsersToAdd()).toEqual([mockUsers[1]] as unknown as User[]);
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
      vi.spyOn(chatService, 'rooms').mockReturnValue([
        {
          id: '1',
          members: [{ userId: 'u_curr' }],
        } as unknown as ChatRoom,
      ]);
      expect(component.isMessageRead(mockMessage)).toBe(false);
    });

    it('should return false if other members have not read', () => {
      vi.spyOn(chatService, 'rooms').mockReturnValue([
        {
          id: '1',
          members: [
            { userId: 'u_curr' },
            { userId: 'u_other', lastReadAt: '2022-01-01T10:00:00Z' }, // before message
          ],
        } as unknown as ChatRoom,
      ]);
      expect(component.isMessageRead(mockMessage)).toBe(false);
    });

    it('should return true if any other member has read', () => {
      vi.spyOn(chatService, 'rooms').mockReturnValue([
        {
          id: '1',
          members: [
            { userId: 'u_curr' },
            { userId: 'u_other', lastReadAt: '2023-01-01T11:00:00Z' }, // after message
          ],
        } as unknown as ChatRoom,
      ]);
      expect(component.isMessageRead(mockMessage)).toBe(true);
    });
  });

  describe('Chat Management (Rename and Delete)', () => {
    let authService: AuthService;

    beforeEach(() => {
      authService = TestBed.inject(AuthService);
    });

    it('should compute canDeleteRoom based on user role', () => {
      // Admin
      // @ts-expect-error mocking currentUser property for tests
      authService.currentUser = signal({ id: 'u1', role: 'admin' });
      fixture.destroy();
      fixture = TestBed.createComponent(ChatComponent);
      component = fixture.componentInstance;
      expect(component.canDeleteRoom()).toBe(true);

      // Moderator
      // @ts-expect-error mocking currentUser property for tests
      authService.currentUser = signal({ id: 'u1', role: 'moderator' });
      fixture.destroy();
      fixture = TestBed.createComponent(ChatComponent);
      component = fixture.componentInstance;
      expect(component.canDeleteRoom()).toBe(true);

      // User
      // @ts-expect-error mocking currentUser property for tests
      authService.currentUser = signal({ id: 'u1', role: 'user' });
      fixture.destroy();
      fixture = TestBed.createComponent(ChatComponent);
      component = fixture.componentInstance;
      expect(component.canDeleteRoom()).toBe(false);
    });

    it('should start rename room and set name state', () => {
      const room = { id: 'room-1', name: 'Original Name' } as ChatRoom;
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('room-1');
      vi.spyOn(chatService, 'rooms').mockReturnValue([room]);

      component.startRenameRoom();

      expect(component.isRenamingRoom()).toBe(true);
      expect(component.renameRoomName()).toBe('Original Name');
    });

    it('should cancel rename and reset state', () => {
      component.isRenamingRoom.set(true);
      component.renameRoomName.set('Some Name');

      component.cancelRename();

      expect(component.isRenamingRoom()).toBe(false);
      expect(component.renameRoomName()).toBe('');
    });

    it('should submit rename room and handle success', () => {
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('room-1');
      vi.spyOn(chatService, 'renameRoom').mockReturnValue(of({} as ChatRoom));
      vi.spyOn(chatService, 'fetchRooms');
      vi.spyOn(component, 'cancelRename');

      component.renameRoomName.set('New Name');
      component.submitRenameRoom();

      expect(chatService.renameRoom).toHaveBeenCalledWith('room-1', 'New Name');
      expect(chatService.fetchRooms).toHaveBeenCalled();
      expect(component.cancelRename).toHaveBeenCalled();
    });

    it('should submit rename room and log error on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('room-1');
      vi.spyOn(chatService, 'renameRoom').mockReturnValue(throwError(() => new Error('test')));

      component.renameRoomName.set('New Name');
      component.submitRenameRoom();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to rename room', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should toggle showDeleteConfirm state', () => {
      expect(component.showDeleteConfirm()).toBe(false);
      component.confirmDelete();
      expect(component.showDeleteConfirm()).toBe(true);
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should call deleteRoom and handle success', () => {
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('room-1');
      vi.spyOn(chatService.activeRoomId, 'set');
      vi.spyOn(chatService, 'deleteRoom').mockReturnValue(of(undefined));
      vi.spyOn(chatService, 'fetchRooms');
      component.showDeleteConfirm.set(true);

      component.deleteRoom();

      expect(chatService.deleteRoom).toHaveBeenCalledWith('room-1');
      expect(chatService.activeRoomId.set).toHaveBeenCalledWith(null);
      expect(chatService.fetchRooms).toHaveBeenCalled();
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should call deleteRoom and log error on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(chatService, 'activeRoomId').mockReturnValue('room-1');
      vi.spyOn(chatService, 'deleteRoom').mockReturnValue(throwError(() => new Error('test')));
      component.showDeleteConfirm.set(true);

      component.deleteRoom();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete room', expect.any(Error));
      expect(component.showDeleteConfirm()).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
