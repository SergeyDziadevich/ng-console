import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Login, GoogleCredentialResponse } from './login';
import { AuthService } from '../../services/auth.service';

interface MockAuthService {
  login: Mock;
  googleLogin: Mock;
  verify2FA: Mock;
}

interface ExposedLogin {
  handleGoogleCredentialResponse: (res: GoogleCredentialResponse) => void;
  onSubmit: () => void;
  form: FormGroup<{ email: FormControl<string | null>; password: FormControl<string | null> }>;
  codeForm: FormGroup<{ twoFactorCode: FormControl<string | null> }>;
  loading: Signal<boolean>;
  step: WritableSignal<1 | 2>;
  tempToken: WritableSignal<string>;
  errorMessage: Signal<string | null>;
}

describe('Login Component', () => {
  let component: Login;
  let exposedComponent: ExposedLogin;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: MockAuthService;
  let mockRouter: { navigate: Mock };

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
      googleLogin: vi.fn(),
      verify2FA: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, Login],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    exposedComponent = component as unknown as ExposedLogin;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Google Login', () => {
    it('should navigate to home on success without 2FA', () => {
      mockAuthService.googleLogin.mockReturnValue(of({ requires2fa: false }));

      exposedComponent.handleGoogleCredentialResponse({ credential: 'test_cred' });

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith('test_cred');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      expect(exposedComponent.loading()).toBe(false);
    });

    it('should set step to 2 on success with 2FA', () => {
      mockAuthService.googleLogin.mockReturnValue(
        of({ requires2fa: true, tempToken: 'temp_token' }),
      );

      exposedComponent.handleGoogleCredentialResponse({ credential: 'test_cred' });

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith('test_cred');
      expect(exposedComponent.step()).toBe(2);
      expect(exposedComponent.tempToken()).toBe('temp_token');
      expect(exposedComponent.loading()).toBe(false);
    });

    it('should set error message on failure', () => {
      mockAuthService.googleLogin.mockReturnValue(
        throwError(() => ({ error: { message: 'Google error' } })),
      );

      exposedComponent.handleGoogleCredentialResponse({ credential: 'test_cred' });

      expect(exposedComponent.errorMessage()).toBe('Google error');
      expect(exposedComponent.loading()).toBe(false);
    });
  });

  describe('onSubmit (Step 1)', () => {
    it('should mark form as touched and not login if form is invalid', () => {
      exposedComponent.form.controls.email.setValue('');
      exposedComponent.form.controls.password.setValue('');

      exposedComponent.onSubmit();

      expect(exposedComponent.form.touched).toBe(true);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should navigate to home on success without 2FA', () => {
      exposedComponent.form.controls.email.setValue('test@example.com');
      exposedComponent.form.controls.password.setValue('password123');
      mockAuthService.login.mockReturnValue(of({ requires2fa: false }));

      exposedComponent.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set step to 2 on success with 2FA', () => {
      exposedComponent.form.controls.email.setValue('test@example.com');
      exposedComponent.form.controls.password.setValue('password123');
      mockAuthService.login.mockReturnValue(of({ requires2fa: true, tempToken: 'temp_token_1' }));

      exposedComponent.onSubmit();

      expect(exposedComponent.step()).toBe(2);
      expect(exposedComponent.tempToken()).toBe('temp_token_1');
    });

    it('should set error message on login failure', () => {
      exposedComponent.form.controls.email.setValue('test@example.com');
      exposedComponent.form.controls.password.setValue('password123');
      mockAuthService.login.mockReturnValue(
        throwError(() => ({ error: { message: 'Login error' } })),
      );

      exposedComponent.onSubmit();

      expect(exposedComponent.errorMessage()).toBe('Login error');
    });
  });

  describe('onSubmit (Step 2)', () => {
    beforeEach(() => {
      exposedComponent.step.set(2);
      exposedComponent.tempToken.set('test_temp_token');
    });

    it('should mark codeForm as touched and not verify if form is invalid', () => {
      exposedComponent.codeForm.controls.twoFactorCode.setValue('');

      exposedComponent.onSubmit();

      expect(exposedComponent.codeForm.touched).toBe(true);
      expect(mockAuthService.verify2FA).not.toHaveBeenCalled();
    });

    it('should navigate to home on successful 2FA verification', () => {
      exposedComponent.codeForm.controls.twoFactorCode.setValue('123456');
      mockAuthService.verify2FA.mockReturnValue(of({}));

      exposedComponent.onSubmit();

      expect(mockAuthService.verify2FA).toHaveBeenCalledWith('test_temp_token', '123456');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set error message on 2FA failure', () => {
      exposedComponent.codeForm.controls.twoFactorCode.setValue('123456');
      mockAuthService.verify2FA.mockReturnValue(
        throwError(() => ({ error: { message: 'Invalid code' } })),
      );

      exposedComponent.onSubmit();

      expect(exposedComponent.errorMessage()).toBe('Invalid code');
    });
  });
});
