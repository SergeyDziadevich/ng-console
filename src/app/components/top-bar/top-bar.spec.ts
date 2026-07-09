import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopBar } from './top-bar';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('TopBar', () => {
  let component: TopBar;
  let fixture: ComponentFixture<TopBar>;
  let authServiceSpy: {
    logout: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof signal<{ name: string; email: string }>>;
  };

  beforeEach(async () => {
    authServiceSpy = {
      logout: vi.fn(),
      currentUser: signal({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TopBar],
      providers: [{ provide: AuthService, useValue: authServiceSpy }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user initials as avatar', () => {
    expect(component['userAvatar']()).toBe('JA');
    const avatarBtn = fixture.debugElement.query(By.css('button.bg-indigo-500'));
    expect(avatarBtn.nativeElement.textContent.trim()).toBe('JA');
  });

  it('should toggle dropdown open and close', () => {
    expect(component['dropdownOpen']()).toBe(false);

    component['toggleDropdown']();
    expect(component['dropdownOpen']()).toBe(true);

    component['closeDropdown']();
    expect(component['dropdownOpen']()).toBe(false);
  });

  it('should call authService.logout() when "Sign Out" is clicked', () => {
    component['onMenuItemClick']('Sign Out');
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should close dropdown when a menu item is clicked', () => {
    component['dropdownOpen'].set(true);
    component['onMenuItemClick']('My Profile');
    expect(component['dropdownOpen']()).toBe(false);
    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });

  it('should display the app title "Ng Console Platform"', () => {
    const titleElement = fixture.nativeElement.querySelector('span.tracking-tight');
    expect(titleElement).toBeTruthy();
    expect(titleElement.textContent.trim()).toContain('Console Platform');
  });
});
