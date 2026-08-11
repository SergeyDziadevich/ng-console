import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfigService } from '../../services/config.service';

export interface GoogleCredentialResponse {
  credential: string;
}

declare let google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (res: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
    };
  };
};

import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly configService = inject(ConfigService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly step = signal<1 | 2>(1);
  protected readonly tempToken = signal<string>('');

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly codeForm = this.fb.group({
    twoFactorCode: ['', [Validators.required]],
  });

  protected readonly googleBtn = viewChild<ElementRef>('googleBtn');

  constructor() {
    afterNextRender(() => {
      const btn = this.googleBtn();
      if (btn) {
        this.renderGoogleButton(btn.nativeElement);
      }
    });
  }

  private renderGoogleButton(element: HTMLElement): void {
    if (typeof google === 'undefined') {
      setTimeout(() => this.renderGoogleButton(element), 100);
      return;
    }
    const clientId = this.configService.config()?.googleClientId || '';
    google.accounts.id.initialize({
      client_id: clientId,
      callback: this.handleGoogleCredentialResponse.bind(this),
    });
    google.accounts.id.renderButton(element, { theme: 'outline', size: 'large', width: '320' });
  }

  protected handleGoogleCredentialResponse(response: GoogleCredentialResponse): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.googleLogin(response.credential).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.requires2fa && res.tempToken) {
          this.step.set(2);
          this.tempToken.set(res.tempToken);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Google login failed. Please try again.');
      },
    });
  }

  protected onSubmit(): void {
    if (this.step() === 1) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }

      this.loading.set(true);
      this.errorMessage.set(null);

      const { email, password } = this.form.getRawValue();

      this.authService.login({ email: email!, password: password! }).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.requires2fa && res.tempToken) {
            this.step.set(2);
            this.tempToken.set(res.tempToken);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Invalid credentials. Please try again.');
        },
      });
    } else {
      if (this.codeForm.invalid) {
        this.codeForm.markAllAsTouched();
        return;
      }

      this.loading.set(true);
      this.errorMessage.set(null);

      const { twoFactorCode } = this.codeForm.getRawValue();

      this.authService.verify2FA(this.tempToken(), twoFactorCode!).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Invalid code. Please try again.');
        },
      });
    }
  }
}
