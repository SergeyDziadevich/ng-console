import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly step = signal<1 | 2>(1);
  protected readonly tempToken = signal<string>('');

  protected readonly form = this.fb.group({
    name: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly codeForm = this.fb.group({
    twoFactorCode: ['', [Validators.required]],
  });

  protected onSubmit(): void {
    if (this.step() === 1) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }

      this.loading.set(true);
      this.errorMessage.set(null);

      const { name, password } = this.form.getRawValue();

      this.authService.login({ username: name!, password: password! }).subscribe({
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
          this.errorMessage.set(
            err?.error?.message ?? 'Invalid credentials. Please try again.',
          );
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
          this.errorMessage.set(
            err?.error?.message ?? 'Invalid code. Please try again.',
          );
        },
      });
    }
  }
}

