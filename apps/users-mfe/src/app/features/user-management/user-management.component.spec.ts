import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { UserManagement } from "./user-management.component";
import { UserService } from "@ng-console/shared/data-access";
import { User } from "@ng-console/shared/models";
import { UserRole } from "@ng-console/shared/models";

describe('UserManagement', () => {
  let component: UserManagement;
  let fixture: ComponentFixture<UserManagement>;
  let router: Router;
  let userService: UserService;

  const mockUser: User = {
    _id: '1',
    username: 'testuser',
    displayName: 'Test User',
    password: 'password',
    email: 'test@example.com',
    role: UserRole.Admin,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagement],
      providers: [
        provideRouter([
          { path: 'user-management/edit-user/:id', component: UserManagement },
          { path: 'login', component: UserManagement },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagement);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    userService = TestBed.inject(UserService);

    // We don't need to wait for fixture.whenStable if we don't trigger change detection yet
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply filter and update userService filterParams', () => {
    component.filterField.set('email');
    component.filterValue.set('test@example.com');

    component.applyFilter();

    expect(userService.filterParams()).toEqual({ filter: 'email', value: 'test@example.com' });
  });

  it('should clear filter and update userService filterParams', () => {
    component.filterValue.set('some value');

    component.clearFilter();

    expect(component.filterValue()).toBe('');
    expect(userService.filterParams()).toEqual({});
  });

  it('should navigate to edit user page', () => {
    vi.spyOn(router, 'navigate');

    component.editUser(mockUser);

    expect(router.navigate).toHaveBeenCalledWith(['/user-management', 'edit-user', mockUser._id]);
  });

  it('should delete user and show toast', () => {
    vi.spyOn(userService, 'deleteUser').mockReturnValue(of(void 0));
    vi.spyOn(component.usersResource, 'reload');

    component.deleteUser(mockUser);

    expect(userService.deleteUser).toHaveBeenCalledWith(mockUser._id);
    expect(component.toast()).toBe('User deleted successfully');
    expect(component.usersResource.reload).toHaveBeenCalled();
  });

  it('should show toast and hide it after 3 seconds', () => {
    vi.useFakeTimers();
    component.showToast('Test Message');

    expect(component.toast()).toBe('Test Message');

    vi.advanceTimersByTime(3000);

    expect(component.toast()).toBeNull();
    vi.useRealTimers();
  });

  it('should clear previous toast timer if showToast is called again', () => {
    vi.useFakeTimers();
    component.showToast('First Message');
    vi.advanceTimersByTime(1500);

    component.showToast('Second Message');
    expect(component.toast()).toBe('Second Message');

    vi.advanceTimersByTime(1500); // 3000ms from first, but should be cancelled
    expect(component.toast()).toBe('Second Message');

    vi.advanceTimersByTime(1500); // 3000ms from second message
    expect(component.toast()).toBeNull();
    vi.useRealTimers();
  });
});
