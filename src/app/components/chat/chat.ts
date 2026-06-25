import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user-service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  imports: [DatePipe, NgClass, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  userService = inject(UserService);
  authService = inject(AuthService);

  newMessage = signal('');
  isCreatingRoom = signal(false);
  newRoomName = signal('');
  selectedUserIds = signal<string[]>([]);
  users = computed(() => this.userService.usersResource.value() ?? []);

  // Add User State
  isAddingUser = signal(false);
  userSearchQuery = signal('');
  selectedUsersToAdd = signal<string[]>([]);
  
  availableUsersToAdd = computed(() => {
    const allUsers = this.users();
    const activeRoomId = this.chatService.activeRoomId();
    if (!activeRoomId) return [];

    const room = this.chatService.rooms().find(r => r.id === activeRoomId);
    if (!room) return [];

    const roomMemberIds = new Set(room.members?.map(m => m.userId) ?? []);
    
    // Filter out existing members
    let available = allUsers.filter(u => !roomMemberIds.has(u._id));
    
    // Filter by search query
    const query = this.userSearchQuery().toLowerCase().trim();
    if (query) {
      available = available.filter(u => 
        (u.displayName?.toLowerCase().includes(query)) || 
        (u.username?.toLowerCase().includes(query))
      );
    }
    
    return available;
  });

  currentUser = this.authService.currentUser;

  ngOnInit() {
    this.chatService.connect();
    this.chatService.fetchRooms();
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }

  selectRoom(roomId: string) {
    this.chatService.selectRoom(roomId);
  }

  sendMessage() {
    const content = this.newMessage().trim();
    const roomId = this.chatService.activeRoomId();
    if (content && roomId) {
      this.chatService.sendMessage(roomId, content);
      this.newMessage.set('');
    }
  }

  toggleCreateRoom() {
    this.isCreatingRoom.update(v => !v);
    if (!this.isCreatingRoom()) {
      this.resetCreateRoomForm();
    }
  }

  toggleUserSelection(userId: string) {
    const current = this.selectedUserIds();
    if (current.includes(userId)) {
      this.selectedUserIds.set(current.filter(id => id !== userId));
    } else {
      this.selectedUserIds.set([...current, userId]);
    }
  }

  createRoom() {
    const name = this.newRoomName().trim();
    const userIds = this.selectedUserIds();
    if (name && userIds.length > 0) {
      this.chatService.createRoom(name, userIds).subscribe({
        next: (room) => {
          this.chatService.fetchRooms();
          this.toggleCreateRoom();
          this.selectRoom(room.id);
        },
        error: (err) => {
          console.error('Failed to create room', err);
        }
      });
    }
  }

  resetCreateRoomForm() {
    this.newRoomName.set('');
    this.selectedUserIds.set([]);
  }

  // Add Users to Existing Room Methods
  toggleAddUser() {
    this.isAddingUser.update(v => !v);
    if (!this.isAddingUser()) {
      this.resetAddUserForm();
    }
  }

  toggleAddUserSelection(userId: string) {
    const current = this.selectedUsersToAdd();
    if (current.includes(userId)) {
      this.selectedUsersToAdd.set(current.filter(id => id !== userId));
    } else {
      this.selectedUsersToAdd.set([...current, userId]);
    }
  }

  addUsersToRoom() {
    const userIds = this.selectedUsersToAdd();
    const roomId = this.chatService.activeRoomId();
    if (roomId && userIds.length > 0) {
      this.chatService.addMembers(roomId, userIds).subscribe({
        next: () => {
          this.chatService.fetchRooms();
          this.toggleAddUser();
        },
        error: (err) => {
          console.error('Failed to add members to room', err);
        }
      });
    }
  }

  resetAddUserForm() {
    this.userSearchQuery.set('');
    this.selectedUsersToAdd.set([]);
  }
}
