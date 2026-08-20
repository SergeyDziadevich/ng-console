import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from "@ng-console/shared/data-access";

interface MockAuthService {
  getToken: Mock;
  logout: Mock;
}

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockAuthService = {
      getToken: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should add Authorization header if token exists', () => {
    mockAuthService.getToken.mockReturnValue('fake-token');

    httpClient.get('/api/test').subscribe();

    const req = httpTestingController.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush({});
  });

  it('should not add Authorization header if token does not exist', () => {
    mockAuthService.getToken.mockReturnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpTestingController.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should call authService.logout() if 401 error occurs', () => {
    mockAuthService.getToken.mockReturnValue('fake-token');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      '401 Unauthorized – session invalidated, redirecting to login.',
    );

    consoleSpy.mockRestore();
  });

  it('should not call authService.logout() for non-401 errors', () => {
    mockAuthService.getToken.mockReturnValue('fake-token');

    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush('Server Error', { status: 500, statusText: 'Server Error' });

    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });
});
