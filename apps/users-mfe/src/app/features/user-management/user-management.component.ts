import { Component, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { UserService } from "@ng-console/shared/data-access";
import { User } from "@ng-console/shared/models";
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersTable } from "./users-table/users-table.component";
import { FormsModule } from '@angular/forms';
import { Toast, SpinnerComponent } from "@ng-console/shared/ui";
import { HasPermissionDirective } from "@ng-console/shared/util";

import { TranslatePipe } from "@ng-console/shared/util";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-management',
  imports: [UsersTable, RouterOutlet, RouterLink, FormsModule, Toast, HasPermissionDirective, SpinnerComponent, TranslatePipe],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement {
  userService = inject(UserService);
  private router = inject(Router);

  usersResource = this.userService.usersResource;
  users = toSignal(this.userService.users$);

  filterField = signal('name');
  filterValue = signal('');
  toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  showToast(message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

  applyFilter() {
    const value = this.filterValue().trim();
    this.userService.filterParams.set(value ? { filter: this.filterField(), value } : {});
  }

  clearFilter() {
    this.filterValue.set('');
    this.userService.filterParams.set({});
  }

  editUser(user: User) {
    this.router.navigate(['/user-management', 'edit-user', user._id]);
  }

  deleteUser(user: User) {
    this.userService.deleteUser(user._id).subscribe(() => {
      this.showToast('User deleted successfully');
      this.usersResource.reload();
    });
  }
}

export { UserManagement as UserManagementComponent };
