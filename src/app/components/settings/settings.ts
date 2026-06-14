import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  qrCodeUrl = signal<string | null>(null);
  isGenerating = signal(false);
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  twoFactorForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6)]]
  });

  generate2FA() {
    this.isGenerating.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    this.authService.generate2FA().subscribe({
      next: (res) => {
        this.qrCodeUrl.set(res.qrCodeUrl);
        this.isGenerating.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to generate 2FA QR code.');
        this.isGenerating.set(false);
      }
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
      error: (err) => {
        this.errorMessage.set('Failed to verify 2FA code. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}
