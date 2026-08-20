import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRole } from "@ng-console/shared/models";

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private readonly authService = inject(AuthService);

  private readonly rolePermissions: Record<string, string[]> = {
    [UserRole.Admin]: ['create-user', 'edit-user', 'delete-user'],
    [UserRole.Moderator]: ['create-user', 'edit-user', 'delete-user'],
    [UserRole.User]: [],
  };

  hasPermission(permission: string) {
    return computed(() => {
      const user = this.authService.currentUser();
      if (!user) return false;

      const userRole = user.role;
      const permissions = this.rolePermissions[userRole] || [];
      return permissions.includes(permission);
    });
  }
}
