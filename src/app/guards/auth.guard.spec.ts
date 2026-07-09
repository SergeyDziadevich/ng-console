import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { authGuard, canMatchAuthGuard, noAuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

interface MockAuthService {
  isAuthenticated: Mock;
  checkSession: Mock;
}

describe('Auth Guards', () => {
  let mockAuthService: MockAuthService;
  let mockRouter: { createUrlTree: Mock };

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: vi.fn(),
      checkSession: vi.fn(),
    };

    mockRouter = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  describe('authGuard', () => {
    it('should call checkSession and return true if authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

      expect(mockAuthService.checkSession).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call checkSession and return UrlTree to /login if not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockRouter.createUrlTree.mockReturnValue('mockUrlTree' as never);

      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

      expect(mockAuthService.checkSession).toHaveBeenCalled();
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).toBe('mockUrlTree');
    });
  });

  describe('canMatchAuthGuard', () => {
    it('should return true if authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      const result = TestBed.runInInjectionContext(() =>
        canMatchAuthGuard({} as never, [], {} as never),
      );
      expect(result).toBe(true);
    });

    it('should return false if not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      const result = TestBed.runInInjectionContext(() =>
        canMatchAuthGuard({} as never, [], {} as never),
      );
      expect(result).toBe(false);
    });
  });

  describe('noAuthGuard', () => {
    it('should return false if authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      const result = TestBed.runInInjectionContext(() => noAuthGuard({} as never, [], {} as never));
      expect(result).toBe(false);
    });

    it('should return true if not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      const result = TestBed.runInInjectionContext(() => noAuthGuard({} as never, [], {} as never));
      expect(result).toBe(true);
    });
  });
});
