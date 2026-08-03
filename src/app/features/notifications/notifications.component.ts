import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '@app/services/auth.service';
import { NotificationsService } from '@app/services/notifications.service';


import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);

  messages = this.notificationsService.messages;
  isOnline = this.notificationsService.isOnline;

  isAdmin = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin';
  });

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
