import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface NotificationMessage {
  id: string;
  title: string;
  body?: string;
  replayed: boolean;
  isSystem?: boolean;
  timestamp?: number;
  isRead?: boolean;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  ts: number;
  isSystem?: boolean;
  type?: string;
  isRead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private zone = inject(NgZone);
  private socket!: Socket;

  messages = signal<NotificationMessage[]>([]);
  isOnline = signal(false);

  unreadCount = computed(() => {
    return this.messages().filter(m => !m.isRead).length;
  });

  unreadMessages = computed(() => {
    return this.messages().filter(m => !m.isRead);
  });

  constructor() {
    this.init();
  }

  private init() {
    this.http.get<NotificationPayload[]>(`${environment.apiUrl}/api/notifications`).subscribe((history) => {
      this.messages.set((history || []).map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        replayed: false,
        isSystem: n.isSystem,
        timestamp: n.ts,
        isRead: n.isRead,
      })));
    });

    this.zone.runOutsideAngular(() => {
      this.socket = io(environment.apiUrl, {
        transports: ['websocket'],
        reconnection: false,
      });

      this.socket.on('connect', () => {
        this.zone.run(() => this.isOnline.set(true));
      });

      this.socket.on('disconnect', () => {
        this.zone.run(() => this.isOnline.set(false));
      });

      this.socket.on('notification', (n: NotificationPayload) => {
        this.zone.run(() => {
          const replayed = this.socket.recovered;

          this.messages.update((msgs) => {
            if (msgs.some(m => m.id === n.id)) return msgs;
            return [
              {
                id: n.id,
                title: n.title,
                body: n.body,
                replayed: !!replayed,
                timestamp: n.ts,
                isSystem: n.isSystem,
                isRead: false,
              },
              ...msgs,
            ];
          });
        });
      });
    });
  }

  sendNotification(title: string): void {
    const user = this.authService.currentUser();
    if (user) {
      this.http.post(`${environment.apiUrl}/api/notifications/notify`, { 
        title, 
        type: 'info', 
        userId: user.id 
      }).subscribe();
    }
  }

  markAsRead(id: string): void {
    if (!id || id.startsWith('sys-')) return;
    this.http.post(`${environment.apiUrl}/api/notifications/${id}/read`, {}).subscribe(() => {
      this.messages.update((msgs) => msgs.map(m => m.id === id ? { ...m, isRead: true } : m));
    });
  }

  dropConnection(): void {
    this.socket.io.engine.close();
    this.messages.update((msgs) => [
      {
        id: 'sys-dropped-' + Date.now(),
        title: '⚡ dropped — staying offline until you click Reconnect',
        isSystem: true,
        replayed: false,
        isRead: true,
      },
      ...msgs,
    ]);
  }

  reconnect(): void {
    this.socket.connect();
  }
}
