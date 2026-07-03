import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-top-bar',
  imports: [CommonModule, RouterLink],
  templateUrl: './top-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  private readonly authService = inject(AuthService);

  protected dropdownOpen = signal(false);

  // protected currentUser = signal({
  //   name: 'Jane Doe',
  //   email: 'jane.doe@example.com',
  //   avatarInitials: 'JD',
  // });

  protected currentUser = this.authService.currentUser;

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
    this.dropdownOpen.update((v) => !v);
  }

  protected closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  protected onMenuItemClick(label: string): void {
    this.closeDropdown();
    if (label === 'Sign Out') {
      this.authService.logout();
    }
  }
}
