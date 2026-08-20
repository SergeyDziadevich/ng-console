import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from "@ng-console/shared/data-access";
import { UserService } from "@ng-console/shared/data-access";
import { User, UserSettings } from "@ng-console/shared/models";
import { Toast, SpinnerComponent } from "@ng-console/shared/ui";
import { IntegrationService } from "@ng-console/shared/data-access";
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService, Theme } from "@ng-console/shared/data-access";
import { TranslationService, SUPPORTED_LANGUAGES, SupportedLanguage } from "@ng-console/shared/data-access";
import { TranslatePipe } from "@ng-console/shared/util";
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideHardDrive,
  lucideCheck,
  lucideAlertCircle,
  lucidePalette,
  lucideBell,
  lucideShieldCheck,
  lucideLink,
  lucideGlobe,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, Toast, SpinnerComponent, NgIconComponent, TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  viewProviders: [
    provideIcons({
      lucideHardDrive,
      lucideCheck,
      lucideAlertCircle,
      lucidePalette,
      lucideBell,
      lucideShieldCheck,
      lucideLink,
      lucideGlobe,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly integrationService = inject(IntegrationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly themeService = inject(ThemeService);
  private readonly translationService = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);
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
  googleDriveSyncEnabled = signal<boolean>(false);
  isGoogleDriveConnecting = signal<boolean>(false);
  currentTheme = this.themeService.currentTheme;
  currentLang = this.translationService.currentLang;
  supportedLanguages = SUPPORTED_LANGUAGES;

  twoFactorForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
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
          this.themeService.setTheme(settings.theme as Theme);
        }
        if (settings.language && settings.language !== this.translationService.currentLang()) {
          this.translationService.setLanguage(settings.language as SupportedLanguage);
        }
        this.googleDriveSyncEnabled.set(settings.googleDriveSyncEnabled ?? false);
        this.finishLoading();

        this.route.queryParams
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            filter((params) => !!params['code']),
            tap(() => this.isGoogleDriveConnecting.set(true)),
            switchMap((params) =>
              this.integrationService.handleGoogleDriveCallback(params['code']).pipe(
                tap(() => {
                  this.googleDriveSyncEnabled.set(true);
                  this.showToast('Google Drive connected successfully!');
                  this.isGoogleDriveConnecting.set(false);
                  // Remove code from URL
                  this.router.navigate([], {
                    queryParams: { code: null },
                    queryParamsHandling: 'merge',
                  });
                }),
                catchError(() => {
                  this.errorMessage.set('Failed to connect Google Drive.');
                  this.isGoogleDriveConnecting.set(false);
                  return EMPTY;
                })
              )
            )
          )
          .subscribe();
      },
      error: () => this.finishLoading(),
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  showToast(message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

  private finishLoading(loadingDelayMs = 50): void {
    setTimeout(() => {
      this.isLoading.set(false);
      requestAnimationFrame(() => this.isReady.set(true));
    }, loadingDelayMs);
  }

  updateTheme(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newTheme = select.value as Theme;
    this.themeService.setTheme(newTheme);

    const user = this.authService.currentUser();
    if (user?.id) {
      this.userService.updateUser(user.id, { settings: { theme: newTheme } }).subscribe({
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

  generate2FA(): void {
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

  turnOn2FA(): void {
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

  connectGoogleDrive(): void {
    this.isGoogleDriveConnecting.set(true);
    this.integrationService.getGoogleDriveAuthUrl().subscribe({
      next: (res) => {
        window.open(res.url, '_self');
      },
      error: () => {
        this.errorMessage.set('Failed to initiate Google Drive connection.');
        this.isGoogleDriveConnecting.set(false);
      },
    });
  }

  disconnectGoogleDrive(): void {
    this.isGoogleDriveConnecting.set(true);
    this.integrationService.disconnectGoogleDrive().subscribe({
      next: () => {
        this.googleDriveSyncEnabled.set(false);
        this.showToast('Google Drive disconnected.');
        this.isGoogleDriveConnecting.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to disconnect Google Drive.');
        this.isGoogleDriveConnecting.set(false);
      },
    });
  }

  updateLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newLang = select.value as SupportedLanguage;
    this.translationService.setLanguage(newLang);

    const user = this.authService.currentUser();
    if (user?.id) {
      this.userService.updateUser(user.id, { settings: { language: newLang } }).subscribe({
        next: () => this.showToast('Language updated successfully!'),
        error: () => this.errorMessage.set('Failed to save language setting.'),
      });
    } else {
      this.showToast('Language updated successfully!');
    }
  }
}
