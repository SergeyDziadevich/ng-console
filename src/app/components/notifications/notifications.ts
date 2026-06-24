import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { io, Socket } from 'socket.io-client';

interface NotificationMessage {
  title: string;
  replayed: boolean;
  isSystem?: boolean;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications implements OnInit, OnDestroy {
  messages = signal<NotificationMessage[]>([]);
  isOnline = signal(false);
  private socket!: Socket;

  ngOnInit(): void {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'], // skip polling -> no sticky-session requirement
      reconnection: false, // we reconnect manually, with the button
    });

    this.socket.on('connect', () => {
      this.isOnline.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isOnline.set(false);
    });

    this.socket.on('notification', (n: any) => {
      console.log('Notif', n);
      const replayed = this.socket.recovered;

      this.messages.update(msgs => [{
        title: n.title,
        replayed: !!replayed
      }, ...msgs]);
    });
  }

  sendNotification(title: string): void {
    fetch('http://localhost:3000/api/notifications/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }

  dropConnection(): void {
    this.socket.io.engine.close();
    this.messages.update(msgs => [{
      title: '⚡ dropped — staying offline until you click Reconnect',
      isSystem: true,
      replayed: false
    }, ...msgs]);
  }

  reconnect(): void {
    this.socket.connect();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
