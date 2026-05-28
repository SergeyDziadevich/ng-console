import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Prevents navigation to protected routes and redirects to /login. */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * canMatch guard – returns false when not authenticated so the router never
 * matches the shell route and therefore never downloads any of its lazy chunks.
 * The wildcard route in app.routes.ts handles the redirect to /login.
 */
export const canMatchAuthGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};

/**
 * canMatch guard for the login route – returns false when the user is already
 * authenticated so the login chunk is never downloaded.
 * The shell route will match next and redirect to the default child.
 */
export const noAuthGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return !authService.isAuthenticated();
};

