import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { vi } from 'vitest';

const TOKEN_KEY = 'auth_token';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: Object }]),
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    // Create token payload for 'isTokenExpired' and 'decodeToken'
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: '123',
        name: 'Test',
        email: 'test@example.com',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    );
    const signature = 'signature';
    const validToken = `${header}.${payload}.${signature}`;

    localStorage.setItem(TOKEN_KEY, validToken);

    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should be created and verify session on init', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.id).toBe('123');
  });

  it('should clear session if token is expired on checkSession', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired
      }),
    );
    const signature = 'signature';
    localStorage.setItem(TOKEN_KEY, `${header}.${payload}.${signature}`);

    service.checkSession();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should decode token without exp claim as valid', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: '123',
      }),
    );
    const signature = 'signature';
    localStorage.setItem(TOKEN_KEY, `${header}.${payload}.${signature}`);

    service.checkSession();
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should login and set token', () => {
    service.login({ username: 'test', password: '123' }).subscribe();

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '456' }));
    const signature = 'signature';
    const token = `${header}.${payload}.${signature}`;

    req.flush({ access_token: token });

    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.id).toBe('456');
  });

  it('should handle google login', () => {
    service.googleLogin('google-token').subscribe();

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/auth/google`);
    expect(req.request.method).toBe('POST');

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '789' }));
    const signature = 'signature';
    const token = `${header}.${payload}.${signature}`;

    req.flush({ access_token: token });

    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.id).toBe('789');
  });

  it('should verify 2FA', () => {
    service.verify2FA('tempToken', '123456').subscribe();

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/auth/2fa/authenticate`);
    expect(req.request.method).toBe('POST');

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '999' }));
    const signature = 'signature';
    const token = `${header}.${payload}.${signature}`;

    req.flush({ access_token: token });

    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.id).toBe('999');
  });

  it('should logout correctly', () => {
    service.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call generate 2FA', () => {
    service.generate2FA().subscribe();

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/auth/2fa/generate`);
    expect(req.request.method).toBe('POST');
    req.flush({ qrCodeUrl: 'test' });
  });

  it('should call turn on 2FA', () => {
    service.turnOn2FA('123456').subscribe();

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/auth/2fa/turn-on`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ twoFactorCode: '123456' });
    req.flush({});
  });

  it('should get token', () => {
    expect(service.getToken()).toBe(localStorage.getItem(TOKEN_KEY));
  });
});
