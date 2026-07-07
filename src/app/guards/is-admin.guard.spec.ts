import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/user-role.enum';
import { isAdminGuard } from './is-admin.guard';
import { User } from '../models/user.model';
import { signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('isAdminGuard', () => {
  let mockRouter: { createUrlTree: Mock };
  let mockAuthService: { currentUser: WritableSignal<User | null> };
  let mockCurrentUserSignal: WritableSignal<User | null>;

  const dummyRoute = {} as unknown as ActivatedRouteSnapshot;
  const dummyState = {} as unknown as RouterStateSnapshot;

  beforeEach(() => {
    mockRouter = { createUrlTree: vi.fn() };
    mockCurrentUserSignal = signal<User | null>(null);

    mockAuthService = {
      currentUser: mockCurrentUserSignal
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
  });

  it('should return true if user is Admin', () => {
    mockCurrentUserSignal.set({
      _id: '1',
      username: 'admin',
      email: 'admin@test.com',
      password: 'hash',
      role: UserRole.Admin,
    });
    
    const result = TestBed.runInInjectionContext(() => isAdminGuard(dummyRoute, dummyState));
    
    expect(result).toBe(true);
  });

  it('should return UrlTree to / if user is not Admin', () => {
    const urlTree = {} as unknown as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(urlTree);
    
    mockCurrentUserSignal.set({
      _id: '2',
      username: 'user',
      email: 'user@test.com',
      password: 'hash',
      role: UserRole.User,
    });
    
    const result = TestBed.runInInjectionContext(() => isAdminGuard(dummyRoute, dummyState));
    
    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should return UrlTree to / if no user is logged in', () => {
    const urlTree = {} as unknown as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(urlTree);
    
    mockCurrentUserSignal.set(null);
    
    const result = TestBed.runInInjectionContext(() => isAdminGuard(dummyRoute, dummyState));
    
    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
