import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';

import { Settings } from './settings';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user-service';

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
          of({ settings: { receiveNotifications: true, receiveEmails: false, receiveSMS: true } }),
        ),
      updateUser: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([{ path: '**', component: Settings }]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
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
    // The test is enough to reach the coverage of ngOnDestroy.
    expect(component.toast()).toBe('Test Toast'); // It doesn't reset because it was cleared
  });
});
