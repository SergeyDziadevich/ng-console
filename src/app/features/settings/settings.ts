import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user-service';
import { User, UserSettings } from '../../models/user.model';
import { Toast, SpinnerComponent } from '@ng-console-platform/ui';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, Toast, SpinnerComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly themeService = inject(ThemeService);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  qrCodeUrl = signal<string | null>(null);
  isGenerating = signal(false);
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  toast = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  isReady = signal<boolean>(false);
  receiveNotifications = signal<boolean>(true);
  receiveEmails = signal<boolean>(false);
  receiveSMS = signal<boolean>(false);
  currentTheme = this.themeService.currentTheme;

  twoFactorForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnDestroy() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  showToast(message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user?.id) {
      this.finishLoading(0);
      return;
    }

    this.userService.getUserById(user.id).subscribe({
      next: (userData: User) => {
        const settings: UserSettings =
          typeof userData.settings === 'object' ? (userData.settings ?? {}) : {};
        this.receiveNotifications.set(settings.receiveNotifications ?? true);
        this.receiveEmails.set(settings.receiveEmails ?? false);
        this.receiveSMS.set(settings.receiveSMS ?? false);
        if (settings.theme && settings.theme !== this.themeService.currentTheme()) {
           this.themeService.setTheme(settings.theme);
        }
        this.finishLoading();
      },
      error: () => this.finishLoading(),
    });
  }

  private finishLoading(loadingDelayMs = 50) {
    setTimeout(() => {
      this.isLoading.set(false);
      requestAnimationFrame(() => this.isReady.set(true));
    }, loadingDelayMs);
  }

  updateTheme(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newTheme = select.value as Theme;
    this.themeService.setTheme(newTheme);
    
    const user = this.authService.currentUser();
    if (user?.id) {
      this.userService
        .updateUser(user.id, { settings: { theme: newTheme } })
        .subscribe({
          next: () => this.showToast('Theme updated successfully!'),
          error: () => this.errorMessage.set('Failed to save theme setting.'),
        });
    }
  }

  toggleSetting(settingKey: 'receiveNotifications' | 'receiveEmails' | 'receiveSMS', event: Event) {
    const input = event.target as HTMLInputElement;
    const user = this.authService.currentUser();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (user?.id) {
      if (settingKey === 'receiveNotifications') this.receiveNotifications.set(input.checked);
      if (settingKey === 'receiveEmails') this.receiveEmails.set(input.checked);
      if (settingKey === 'receiveSMS') this.receiveSMS.set(input.checked);

      this.userService
        .updateUser(user.id, { settings: { [settingKey]: input.checked } })
        .subscribe({
          next: () => {
            this.showToast('Notification settings updated successfully!');
          },
          error: () => {
            this.errorMessage.set('Failed to update notification settings.');
            if (settingKey === 'receiveNotifications')
              this.receiveNotifications.set(!input.checked);
            if (settingKey === 'receiveEmails') this.receiveEmails.set(!input.checked);
            if (settingKey === 'receiveSMS') this.receiveSMS.set(!input.checked);
          },
        });
    }
  }

  generate2FA() {
    this.isGenerating.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.generate2FA().subscribe({
      next: (res) => {
        this.qrCodeUrl.set(res.qrCodeUrl);
        this.isGenerating.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to generate 2FA QR code.');
        this.isGenerating.set(false);
      },
    });
  }

  turnOn2FA() {
    if (this.twoFactorForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { code } = this.twoFactorForm.getRawValue();

    this.authService.turnOn2FA(code!).subscribe({
      next: () => {
        this.successMessage.set('2FA enabled successfully!');
        this.isSubmitting.set(false);
        this.qrCodeUrl.set(null);
        this.twoFactorForm.reset();
      },
      error: () => {
        this.errorMessage.set('Failed to verify 2FA code. Please try again.');
        this.isSubmitting.set(false);
      },
    });
  }
}
