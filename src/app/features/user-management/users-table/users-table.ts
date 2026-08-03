import { Component, input, output, signal, computed, effect } from '@angular/core';
import { User } from '../../../models/user.model';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { ClickOutsideDirective } from '../../../directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideEdit, lucideTrash2, lucideArrowUp, lucideArrowDown, lucideArrowUpDown } from '@ng-icons/lucide';
import { ConfirmDialogComponent } from '@ng-console-platform/ui';

import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-users-table',
  imports: [HasPermissionDirective, ClickOutsideDirective, NgIconComponent, ConfirmDialogComponent, TranslatePipe],
  templateUrl: './users-table.html',
  styleUrl: './users-table.scss',
  viewProviders: [provideIcons({ lucideEdit, lucideTrash2, lucideArrowUp, lucideArrowDown, lucideArrowUpDown })],
})
export class UsersTable {
  users = input<User[]>([]);

  edit = output<User>();
  delete = output<User>();

  userToDelete = signal<User | null>(null);

  currentPage = signal(1);
  pageSize = signal<number | 'all'>(25);


  sortColumn = signal<keyof User | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  searchName = signal<string>('');
  searchEmail = signal<string>('');

  isNameSearchVisible = signal<boolean>(false);
  isEmailSearchVisible = signal<boolean>(false);

  updateSearchName(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchName.set(val);
    this.currentPage.set(1);
  }

  updateSearchEmail(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchEmail.set(val);
    this.currentPage.set(1);
  }

  onNameTitleClick() {
    this.isNameSearchVisible.set(true);
    this.sortBy('username');
  }

  onEmailTitleClick() {
    this.isEmailSearchVisible.set(true);
    this.sortBy('email');
  }

  onNameSearchBlur() {
    this.isNameSearchVisible.set(false);
  }

  onEmailSearchBlur() {
    this.isEmailSearchVisible.set(false);
  }

  filteredUsers = computed(() => {
    let result = this.users();
    const sName = this.searchName().toLowerCase().trim();
    const sEmail = this.searchEmail().toLowerCase().trim();

    if (sName) {
      result = result.filter(u => u.username.toLowerCase().includes(sName));
    }
    if (sEmail) {
      result = result.filter(u => u.email.toLowerCase().includes(sEmail));
    }
    return result;
  });

  sortedUsers = computed(() => {
    const allUsers = [...this.filteredUsers()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    
    if (!col) return allUsers;
    
    return allUsers.sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return dir === 'asc' ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      
      return 0;
    });
  });

  sortBy(column: keyof User) {
    if (this.sortColumn() === column) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortColumn.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  paginatedUsers = computed(() => {
    const allUsers = this.sortedUsers();
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
    const allUsers = this.filteredUsers();
    const size = this.pageSize();
    if (size === 'all') return 1;
    return Math.ceil(allUsers.length / size) || 1;
  });

  constructor() {
    // Reset to page 1 if users data changes significantly (optional, but good UX)
    effect(
      () => {
        this.users();
        this.currentPage.set(1);
      },
      { allowSignalWrites: true },
    );
  }

  onPageSizeChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.pageSize.set(val === 'all' ? 'all' : Number(val));
    this.currentPage.set(1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
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
