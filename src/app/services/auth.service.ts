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

  readonly currentUser = signal<AuthResponse['user'] | null>(null);

  login(credentials: LoginCredentials) {
    return this.http
      .post(`${environment.apiUrl}/api/auth/login`, credentials, { responseType: 'json' })
      .pipe(
        tap((res: any) => {
          console.log('Login successful: ', res.access_token);
         // {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
          localStorage.setItem(TOKEN_KEY, `${res.access_token}`);
          this.isAuthenticated.set(true);
          this.currentUser.set(res);
        }),
      );
  }

  // login(credentials: LoginCredentials) {
  //   return this.http
  //     .post(`${environment.apiUrl}/api/auth`, credentials, { responseType: 'json' })
  //     .pipe(
  //       tap((res: any) => {
  //         console.log('Login successful: ', res);
  //         localStorage.setItem(TOKEN_KEY, `${res.name}-${res.email}`);
  //         this.isAuthenticated.set(true);
  //         this.currentUser.set(res);
  //       }),
  //     );
  // }

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

