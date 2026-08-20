import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionsService } from './permissions.service';
import { AuthService } from './auth.service';
import { UserRole } from "@ng-console/shared/models";
import { signal } from '@angular/core';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<{ role: string } | null>>;
  };

  beforeEach(() => {
    authServiceMock = {
      currentUser: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [PermissionsService, { provide: AuthService, useValue: authServiceMock }],
    });
    service = TestBed.inject(PermissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('hasPermission', () => {
    it('should return false if there is no current user', () => {
      authServiceMock.currentUser.set(null);
      const hasPerm = service.hasPermission('create-user');
      expect(hasPerm()).toBe(false);
    });

    it('should return true for admin with create-user permission', () => {
      authServiceMock.currentUser.set({ role: UserRole.Admin });
      const hasPerm = service.hasPermission('create-user');
      expect(hasPerm()).toBe(true);
    });

    it('should return true for moderator with edit-user permission', () => {
      authServiceMock.currentUser.set({ role: UserRole.Moderator });
      const hasPerm = service.hasPermission('edit-user');
      expect(hasPerm()).toBe(true);
    });

    it('should return false for user with delete-user permission', () => {
      authServiceMock.currentUser.set({ role: UserRole.User });
      const hasPerm = service.hasPermission('delete-user');
      expect(hasPerm()).toBe(false);
    });

    it('should return false for admin with unknown permission', () => {
      authServiceMock.currentUser.set({ role: UserRole.Admin });
      const hasPerm = service.hasPermission('unknown-permission');
      expect(hasPerm()).toBe(false);
    });

    it('should update dynamically when user role changes', () => {
      authServiceMock.currentUser.set({ role: UserRole.User });
      const hasPerm = service.hasPermission('create-user');
      expect(hasPerm()).toBe(false);

      // Change user to admin
      authServiceMock.currentUser.set({ role: UserRole.Admin });
      expect(hasPerm()).toBe(true);
    });
  });
});
