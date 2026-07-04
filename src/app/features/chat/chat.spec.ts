import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { Chat } from './chat';
import { ChatService } from '../../services/chat.service';
import { provideRouter } from '@angular/router';
import { ChatRoom } from '../../models/chat.model';

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
});
