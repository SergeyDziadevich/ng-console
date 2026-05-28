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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly isAuthenticated = signal(!!localStorage.getItem(TOKEN_KEY));

  readonly currentUser = signal<AuthResponse['user'] | null>(
    this.decodeToken(localStorage.getItem(TOKEN_KEY))
  );

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

