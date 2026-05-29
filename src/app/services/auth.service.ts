import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginCredentials {
  // email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const TOKEN_KEY = 'auth_token';
/** Seconds of clock-skew tolerance before treating a token as expired. */
const EXPIRY_BUFFER_S = 30;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly isAuthenticated = signal(
    !!localStorage.getItem(TOKEN_KEY) && !this.isTokenExpired(localStorage.getItem(TOKEN_KEY))
  );

  readonly currentUser = signal<AuthResponse['user'] | null>(
    this.decodeToken(localStorage.getItem(TOKEN_KEY))
  );

  constructor() {
    // On app boot, clear any stale/expired token from a previous session.
    this.checkSession();
  }

  /**
   * Decodes the payload of a JWT access token without verifying the signature.
   * Returns the parsed payload object, or null if the token is invalid/missing.
   */
  decodeToken(token: string | null): AuthResponse['user'] | null {
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      // Convert base64url → base64 and decode
      const decoded = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(decoded);
      console.log('Decoded token payload:', payload);
      return {
        name: payload.name ?? payload.username ?? '',
        email: payload.email ?? '',
        role: payload.role ?? '',
      };
    } catch (e) {
      console.error('Failed to decode token', e);
      return null;
    }
  }

  /**
   * Returns true when the JWT is expired (or unparseable), accounting for a
   * small clock-skew buffer.  Tokens without an `exp` claim are treated as
   * non-expiring (returns false).
   */
  isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(decoded);
      if (payload.exp === undefined) return false; // no expiry claim → valid
      // exp is in seconds, Date.now() in ms
      return payload.exp - EXPIRY_BUFFER_S < Date.now() / 1000;
    } catch {
      return true; // malformed token → treat as expired
    }
  }

  /**
   * Validates the current token on each call.
   * If the token is missing or expired, clears the session and navigates to
   * the login page.  Safe to call at any point (guard, interceptor, init).
   */
  checkSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (this.isTokenExpired(token)) {
      console.warn('Session token is missing or expired – logging out.');
      localStorage.removeItem(TOKEN_KEY);
      this.isAuthenticated.set(false);
      this.currentUser.set(null);
      this.router.navigate(['/login']);
    }
  }

  login(credentials: LoginCredentials) {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/api/auth/login`, credentials, { responseType: 'json' })
      .pipe(
        tap((res) => {
          const token: string = res.access_token;
          console.log('Login successful – raw token:', token);
          localStorage.setItem(TOKEN_KEY, token);
          this.isAuthenticated.set(true);
          // Decode the JWT to populate currentUser from its claims
          this.currentUser.set(this.decodeToken(token));
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}

