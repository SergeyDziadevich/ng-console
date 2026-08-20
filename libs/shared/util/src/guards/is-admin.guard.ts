import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from "@ng-console/shared/data-access";
import { UserRole } from "@ng-console/shared/models";

export const isAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (user && user.role === UserRole.Admin) {
    return true;
  }

  return router.createUrlTree(['/']);
};
