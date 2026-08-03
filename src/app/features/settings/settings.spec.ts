import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';

import { Settings } from './settings';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user-service';
import { ThemeService } from '../../services/theme.service';
import { IntegrationService } from '../../services/integration.service';
import { ActivatedRoute, Router } from '@angular/router';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockAuthService: {
    currentUser: WritableSignal<{ id: string; name: string; email: string; role: string } | null>;
    generate2FA: Mock;
    turnOn2FA: Mock;
  };
  let mockUserService: {
    getUserById: Mock;
    updateUser: Mock;
  };
  let mockThemeService: {
    currentTheme: WritableSignal<string>;
    setTheme: Mock;
  };
  let mockIntegrationService: {
    getGoogleDriveAuthUrl: Mock;
    handleGoogleDriveCallback: Mock;
    disconnectGoogleDrive: Mock;
  };
  let mockActivatedRoute: unknown;
  let mockRouter: unknown;

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal({ id: '1', name: 'Test', email: 'test@test.com', role: 'user' }),
      generate2FA: vi.fn().mockReturnValue(of({ qrCodeUrl: 'test-url' })),
      turnOn2FA: vi.fn().mockReturnValue(of({})),
    };

    mockUserService = {
      getUserById: vi
        .fn()
        .mockReturnValue(
          of({ settings: { receiveNotifications: true, receiveEmails: false, receiveSMS: true, googleDriveSyncEnabled: false } }),
        ),
      updateUser: vi.fn().mockReturnValue(of({})),
    };

    mockThemeService = {
      currentTheme: signal('light'),
      setTheme: vi.fn(),
    };

    mockIntegrationService = {
      getGoogleDriveAuthUrl: vi.fn().mockReturnValue(of({ url: 'http://auth-url' })),
      handleGoogleDriveCallback: vi.fn().mockReturnValue(of({})),
      disconnectGoogleDrive: vi.fn().mockReturnValue(of({})),
    };

    mockActivatedRoute = {
      queryParams: of({})
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([{ path: '**', component: Settings }]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create and load user settings on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockUserService.getUserById).toHaveBeenCalledWith('1');
    expect(component.receiveNotifications()).toBe(true);
    expect(component.receiveEmails()).toBe(false);
    expect(component.receiveSMS()).toBe(true);

    // Fast-forward to trigger finishLoading timeout
    vi.advanceTimersByTime(50);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle no current user on init', () => {
    mockAuthService.currentUser.set(null);
    fixture.detectChanges();

    expect(mockUserService.getUserById).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle get user by id error', () => {
    mockUserService.getUserById.mockReturnValue(throwError(() => new Error('Error')));
    fixture.detectChanges();

    vi.advanceTimersByTime(50);
    expect(component.isLoading()).toBe(false);
  });

  it('should toggle setting and update user successfully', () => {
    fixture.detectChanges();

    const event = { target: { checked: false } } as unknown as Event;
    component.toggleSetting('receiveNotifications', event);

    expect(component.receiveNotifications()).toBe(false);
    expect(mockUserService.updateUser).toHaveBeenCalledWith('1', {
      settings: { receiveNotifications: false },
    });
    expect(component.toast()).toBe('Notification settings updated successfully!');
  });

  it('should toggle setting and handle error (revert value)', () => {
    fixture.detectChanges();
    mockUserService.updateUser.mockReturnValue(throwError(() => new Error('Error')));

    const event = { target: { checked: false } } as unknown as Event;
    component.toggleSetting('receiveNotifications', event);

    // Value is reverted
    expect(component.receiveNotifications()).toBe(true);
    expect(component.errorMessage()).toBe('Failed to update notification settings.');
  });

  it('should handle generate2FA success', () => {
    component.generate2FA();

    expect(component.isGenerating()).toBe(false);
    expect(component.qrCodeUrl()).toBe('test-url');
  });

  it('should handle generate2FA error', () => {
    mockAuthService.generate2FA.mockReturnValue(throwError(() => new Error('Error')));
    component.generate2FA();

    expect(component.isGenerating()).toBe(false);
    expect(component.errorMessage()).toBe('Failed to generate 2FA QR code.');
  });

  it('should not turnOn2FA if form is invalid', () => {
    component.twoFactorForm.setValue({ code: '123' }); // minLength is 6
    component.turnOn2FA();

    expect(mockAuthService.turnOn2FA).not.toHaveBeenCalled();
  });

  it('should turnOn2FA successfully', () => {
    component.twoFactorForm.setValue({ code: '123456' });
    component.turnOn2FA();

    expect(mockAuthService.turnOn2FA).toHaveBeenCalledWith('123456');
    expect(component.successMessage()).toBe('2FA enabled successfully!');
    expect(component.qrCodeUrl()).toBeNull();
  });

  it('should handle turnOn2FA error', () => {
    mockAuthService.turnOn2FA.mockReturnValue(throwError(() => new Error('Error')));
    component.twoFactorForm.setValue({ code: '123456' });
    component.turnOn2FA();

    expect(component.errorMessage()).toBe('Failed to verify 2FA code. Please try again.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show toast and hide it after 3 seconds', () => {
    component.showToast('Test Toast');
    expect(component.toast()).toBe('Test Toast');

    vi.advanceTimersByTime(3000);
    expect(component.toast()).toBeNull();
  });

  it('should clear timer on ngOnDestroy', () => {
    component.showToast('Test Toast');
    component.ngOnDestroy();

    vi.advanceTimersByTime(3000);
    // Even if time passes, it won't crash if we cleared it properly,
    // actually, we can just spy on clearTimeout to be absolutely sure.
    expect(component.toast()).toBe('Test Toast'); // It doesn't reset because it was cleared
  });

  describe('Google Drive Integration', () => {
    it('should connect to Google Drive successfully', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component.connectGoogleDrive();
      expect(component.isGoogleDriveConnecting()).toBe(true);
      expect(mockIntegrationService.getGoogleDriveAuthUrl).toHaveBeenCalled();
      expect(windowOpenSpy).toHaveBeenCalledWith('http://auth-url', '_self');
    });

    it('should handle connect to Google Drive error', () => {
      mockIntegrationService.getGoogleDriveAuthUrl.mockReturnValue(throwError(() => new Error('Error')));
      component.connectGoogleDrive();
      expect(component.errorMessage()).toBe('Failed to initiate Google Drive connection.');
      expect(component.isGoogleDriveConnecting()).toBe(false);
    });

    it('should disconnect from Google Drive successfully', () => {
      component.googleDriveSyncEnabled.set(true);
      component.disconnectGoogleDrive();
      expect(mockIntegrationService.disconnectGoogleDrive).toHaveBeenCalled();
      expect(component.googleDriveSyncEnabled()).toBe(false);
      expect(component.toast()).toBe('Google Drive disconnected.');
      expect(component.isGoogleDriveConnecting()).toBe(false);
    });

    it('should handle disconnect from Google Drive error', () => {
      mockIntegrationService.disconnectGoogleDrive.mockReturnValue(throwError(() => new Error('Error')));
      component.googleDriveSyncEnabled.set(true);
      component.disconnectGoogleDrive();
      expect(component.errorMessage()).toBe('Failed to disconnect Google Drive.');
      expect(component.isGoogleDriveConnecting()).toBe(false);
    });
  });
});
