import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { AiService } from '@app/services/ai.service';
import { NotificationsService } from '@app/services/notifications.service';
import { ThemeService } from '@app/services/theme.service';

@Component({
  selector: 'app-top-bar',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  private readonly authService = inject(AuthService);
  private readonly aiService = inject(AiService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly themeService = inject(ThemeService);

  protected dropdownOpen = signal(false);
  protected notificationsOpen = signal(false);

  protected currentUser = this.authService.currentUser;
  protected unreadCount = this.notificationsService.unreadCount;
  protected unreadMessages = this.notificationsService.unreadMessages;
  protected activeThemeMode = this.themeService.activeThemeMode;

  protected userAvatar = computed(() => this.currentUser()?.name.slice(0, 2).toUpperCase() || 'NA');

  protected menuItems = [
    {
      label: 'My Profile',
      icon: 'icon-my-profile.svg',
      route: null,
    },
    {
      label: 'Account Settings',
      icon: 'icon-account-settings.svg',
      route: '/settings',
    },
    {
      label: 'Notifications',
      icon: 'icon-notifications-dark.svg',
      route: '/notifications',
    },
    {
      label: 'Sign Out',
      icon: 'icon-sign-out.svg',
      route: null,
    },
  ];

  protected toggleDropdown(): void {
    if (this.notificationsOpen()) this.notificationsOpen.set(false);
    this.dropdownOpen.update((v) => !v);
  }

  protected closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  protected toggleNotifications(): void {
    if (this.dropdownOpen()) this.dropdownOpen.set(false);
    this.notificationsOpen.update((v) => !v);
  }

  protected closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  protected onMenuItemClick(label: string): void {
    this.closeDropdown();
    if (label === 'Sign Out') {
      this.authService.logout();
    }
  }

  protected toggleAiAssistant(): void {
    this.aiService.toggleCommandPalette();
  }

  protected markAsRead(id: string): void {
    this.notificationsService.markAsRead(id);
  }

  protected toggleTheme(): void {
    const newTheme = this.activeThemeMode() === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
  }
}
