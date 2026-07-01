import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

interface NotificationMessage {
  title: string;
  replayed: boolean;
  isSystem?: boolean;
  timestamp?: number;
}

interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  ts: number;
}

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications implements OnInit, OnDestroy {
  messages = signal<NotificationMessage[]>([]);
  isOnline = signal(false);
  private socket!: Socket;
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket'], // skip polling -> no sticky-session requirement
      reconnection: false, // we reconnect manually, with the button
    });

    this.socket.on('connect', () => {
      this.isOnline.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isOnline.set(false);
    });

    this.socket.on('notification', (n: NotificationPayload) => {
      console.log('Notification', n);
      const replayed = this.socket.recovered;

      this.messages.update((msgs) => [
        {
          title: n.title,
          replayed: !!replayed,
          timestamp: n.ts,
        },
        ...msgs,
      ]);
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendNotification(title: string): void {
    this.http.post(`${environment.apiUrl}/api/notifications/notify`, { title }).subscribe();
  }

  dropConnection(): void {
    this.socket.io.engine.close();
    this.messages.update((msgs) => [
      {
        title: '⚡ dropped — staying offline until you click Reconnect',
        isSystem: true,
        replayed: false,
      },
      ...msgs,
    ]);
  }

  reconnect(): void {
    this.socket.connect();
  }
}
