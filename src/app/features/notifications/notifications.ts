import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);

  messages = this.notificationsService.messages;
  isOnline = this.notificationsService.isOnline;

  isAdminOrModerator = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'moderator';
  });

  sendNotification(title: string): void {
    this.notificationsService.sendNotification(title);
  }

  markAsRead(id: string): void {
    this.notificationsService.markAsRead(id);
  }

  dropConnection(): void {
    this.notificationsService.dropConnection();
  }

  reconnect(): void {
    this.notificationsService.reconnect();
  }
}
