import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersTable } from './users-table/users-table';
import { FormsModule } from '@angular/forms';
import { Toast } from '../toast/toast';
import { EditUser } from './edit-user/edit-user';

@Component({
  selector: 'app-user-management',
  imports: [UsersTable, RouterOutlet, RouterLink, FormsModule, Toast, EditUser],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement {
  userService = inject(UserService);

  usersResource = this.userService.usersResource;
  users = toSignal(this.userService.users$);

  filterField = signal('name');
  filterValue = signal('');
  toast = signal<string | null>(null);
  userToEdit = signal<User | null>(null);
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
    this.userToEdit.set(user);
  }

  onEditSaved() {
    this.userToEdit.set(null);
    this.usersResource.reload();
    this.showToast('User updated successfully');
  }

  onEditClosed() {
    this.userToEdit.set(null);
  }

  deleteUser(user: User) {
    this.userService.deleteUser(user._id).subscribe(() => {
      this.showToast('User deleted successfully');
      this.usersResource.reload();
    });
  }
}
