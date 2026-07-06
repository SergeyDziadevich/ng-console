import { Component, input, output, signal, computed, effect } from '@angular/core';
import { User } from '../../../models/user.model';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-users-table',
  imports: [HasPermissionDirective],
  templateUrl: './users-table.html',
  styleUrl: './users-table.scss',
})
export class UsersTable {
  users = input<User[]>([]);

  edit = output<User>();
  delete = output<User>();

  userToDelete = signal<User | null>(null);

  currentPage = signal(1);
  pageSize = signal<number | 'all'>(25);

  paginatedUsers = computed(() => {
    const allUsers = this.users();
    const size = this.pageSize();
    if (size === 'all') return allUsers;
    
    let current = this.currentPage();
    const total = Math.ceil(allUsers.length / size) || 1;
    // Bound the current page if data shrinks
    if (current > total) {
      current = total;
    }
    
    const start = (current - 1) * size;
    return allUsers.slice(start, start + size);
  });

  totalPages = computed(() => {
    const allUsers = this.users();
    const size = this.pageSize();
    if (size === 'all') return 1;
    return Math.ceil(allUsers.length / size) || 1;
  });

  constructor() {
    // Reset to page 1 if users data changes significantly (optional, but good UX)
    effect(() => {
      this.users();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  onPageSizeChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.pageSize.set(val === 'all' ? 'all' : Number(val));
    this.currentPage.set(1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  editUser(user: User) {
    this.edit.emit(user);
  }

  confirmDelete(user: User) {
    this.userToDelete.set(user);
  }

  cancelDelete() {
    this.userToDelete.set(null);
  }

  deleteUser() {
    const user = this.userToDelete();
    if (user) {
      this.delete.emit(user);
      this.userToDelete.set(null);
    }
  }
}
