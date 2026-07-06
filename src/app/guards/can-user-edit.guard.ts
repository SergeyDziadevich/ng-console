import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';

export const canUserEdit: CanActivateFn = () => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  const canEdit = permissionsService.hasPermission('edit-user')();

  if (canEdit) {
    return true;
  }

  return router.createUrlTree(['/']);
};
