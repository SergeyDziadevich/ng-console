import { inject, Injectable, signal, NgZone, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ChatMessage, ChatRoom } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly zone = inject(NgZone);
  private socket: Socket | null = null;

  readonly rooms = signal<ChatRoom[]>([]);
  readonly activeRoomMessages = signal<ChatMessage[]>([]);
  readonly activeRoomId = signal<string | null>(null);
  readonly isOnline = signal(false);
  readonly hasUnreadChats = computed(() => this.rooms().some((r) => r.hasUnread));

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.connect();
        this.fetchRooms();
      } else {
        this.disconnect();
      }
    });
  }

  connect(): void {
    if (this.socket) {
      this.disconnect();
    }

    const token = this.authService.getToken();
    this.socket = io(`${environment.apiUrl}/chat`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.zone.run(() => {
        this.isOnline.set(true);
        console.log('Connected to Chat WebSocket namespace');
      });
    });

    this.socket.on('disconnect', () => {
      this.zone.run(() => {
        this.isOnline.set(false);
        console.log('Disconnected from Chat WebSocket namespace');
      });
    });

    this.socket.on('newMessage', (message: ChatMessage) => {
      this.zone.run(() => {
        console.log('Received new WebSocket message:', message);
        if (this.activeRoomId() === message.roomId) {
          this.activeRoomMessages.update((msgs) => [...msgs, message]);
          this.markAsRead(message.roomId);
        } else {
          this.rooms.update((rooms) =>
            rooms.map((room) => (room.id === message.roomId ? { ...room, hasUnread: true } : room)),
          );
        }
      });
    });

    this.socket.on(
      'readReceiptUpdated',
      (data: { roomId: string; userId: string; lastReadAt: string }) => {
        this.zone.run(() => {
          this.rooms.update((rooms) =>
            rooms.map((room) => {
              if (room.id !== data.roomId) return room;

              const updatedMembers = room.members?.map((m) =>
                m.userId === data.userId ? { ...m, lastReadAt: data.lastReadAt } : m,
              );

              return { ...room, members: updatedMembers };
            }),
          );
        });
      },
    );

    this.socket.on('error', (err: unknown) => {
      this.zone.run(() => {
        console.error('Chat Socket Error:', err);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isOnline.set(false);
    }
  }

  sendMessage(roomId: string, content: string): void {
    if (this.socket && this.isOnline()) {
      this.socket.emit('sendMessage', { roomId, content });
    } else {
      console.error('Cannot send message: Socket is not connected');
    }
  }

  markAsRead(roomId: string): void {
    if (this.socket && this.isOnline()) {
      this.socket.emit('markAsRead', { roomId });
      // Update locally
      this.rooms.update((rooms) =>
        rooms.map((room) => (room.id === roomId ? { ...room, hasUnread: false } : room)),
      );
    }
  }

  fetchRooms(): void {
    this.http.get<ChatRoom[]>(`${environment.apiUrl}/api/chats/rooms?_t=${Date.now()}`).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
      },
      error: (err) => {
        console.error('Failed to fetch chat rooms:', err);
      },
    });
  }

  createRoom(name: string, invitedUserIds: string[]): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`${environment.apiUrl}/api/chats/rooms`, {
      name,
      invitedUserIds,
    });
  }

  addMembers(roomId: string, userIds: string[]): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`${environment.apiUrl}/api/chats/rooms/${roomId}/members`, {
      userIds,
    });
  }

  selectRoom(roomId: string): void {
    this.activeRoomId.set(roomId);
    this.activeRoomMessages.set([]);
    this.fetchRoomMessages(roomId);
    this.markAsRead(roomId);
  }

  private fetchRoomMessages(roomId: string): void {
    this.http
      .get<
        ChatMessage[]
      >(`${environment.apiUrl}/api/chats/rooms/${roomId}/messages?_t=${Date.now()}`)
      .subscribe({
        next: (messages) => {
          this.activeRoomMessages.set(messages);
        },
        error: (err) => {
          console.error(`Failed to fetch messages for room ${roomId}:`, err);
        },
      });
  }
}
