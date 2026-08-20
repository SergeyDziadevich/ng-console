import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from "@ng-console/shared/data-access";
import { UserService } from "@ng-console/shared/data-access";
import { AiService } from "@ng-console/shared/data-access";
import { NotificationsService } from "@ng-console/shared/data-access";
import { ThemeService } from "@ng-console/shared/data-access";
import { TranslationService, SUPPORTED_LANGUAGES, SupportedLanguage } from "@ng-console/shared/data-access";
import { TranslatePipe } from "@ng-console/shared/util";

@Component({
  selector: 'app-top-bar',
  imports: [CommonModule, RouterLink, DatePipe, TranslatePipe],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly aiService = inject(AiService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly themeService = inject(ThemeService);
  private readonly translationService = inject(TranslationService);

  protected dropdownOpen = signal(false);
  protected notificationsOpen = signal(false);
  protected languageMenuOpen = signal(false);

  protected currentUser = this.authService.currentUser;
  protected unreadCount = this.notificationsService.unreadCount;
  protected unreadMessages = this.notificationsService.unreadMessages;
  protected currentTheme = this.themeService.currentTheme;
  protected currentLang = this.translationService.currentLang;
  protected supportedLanguages = SUPPORTED_LANGUAGES;

  protected userAvatar = computed(() => this.currentUser()?.name.slice(0, 2).toUpperCase() || 'NA');

  protected menuItems = [
    {
      labelKey: 'TOPBAR.MY_PROFILE',
      defaultLabel: 'My Profile',
      icon: 'icon-my-profile.svg',
      route: null,
    },
    {
      labelKey: 'TOPBAR.ACCOUNT_SETTINGS',
      defaultLabel: 'Account Settings',
      icon: 'icon-account-settings.svg',
      route: '/settings',
    },
    {
      labelKey: 'TOPBAR.NOTIFICATIONS',
      defaultLabel: 'Notifications',
      icon: 'icon-notifications-dark.svg',
      route: '/notifications',
    },
    {
      labelKey: 'TOPBAR.SIGN_OUT',
      defaultLabel: 'Sign Out',
      icon: 'icon-sign-out.svg',
      route: null,
    },
  ];

  protected toggleDropdown(): void {
    if (this.notificationsOpen()) this.notificationsOpen.set(false);
    if (this.languageMenuOpen()) this.languageMenuOpen.set(false);
    this.dropdownOpen.update((v) => !v);
  }

  protected closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  protected toggleNotifications(): void {
    if (this.dropdownOpen()) this.dropdownOpen.set(false);
    if (this.languageMenuOpen()) this.languageMenuOpen.set(false);
    this.notificationsOpen.update((v) => !v);
  }

  protected closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  protected toggleLanguageMenu(): void {
    if (this.dropdownOpen()) this.dropdownOpen.set(false);
    if (this.notificationsOpen()) this.notificationsOpen.set(false);
    this.languageMenuOpen.update((v) => !v);
  }

  protected closeLanguageMenu(): void {
    this.languageMenuOpen.set(false);
  }

  protected selectLanguage(lang: SupportedLanguage): void {
    this.translationService.setLanguage(lang);
    this.closeLanguageMenu();

    const user = this.authService.currentUser();
    if (user?.id) {
      this.userService.updateUser(user.id, { settings: { language: lang } }).subscribe();
    }
  }

  protected onMenuItemClick(labelKey: string): void {
    this.closeDropdown();
    if (labelKey === 'TOPBAR.SIGN_OUT' || labelKey === 'Sign Out') {
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
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
  }
}

export { TopBarComponent as TopBar };
