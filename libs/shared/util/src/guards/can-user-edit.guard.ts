import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from "@ng-console/shared/data-access";

export const canUserEdit: CanActivateFn = () => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  const canEdit = permissionsService.hasPermission('edit-user')();

  if (canEdit) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export { canUserEdit as canUserEditGuard };
