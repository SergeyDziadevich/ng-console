import { Component, input, output, signal } from '@angular/core';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-users-table',
  imports: [],
  templateUrl: './users-table.html',
  styleUrl: './users-table.css',
})
export class UsersTable {
  users = input<User[]>([]);

  edit = output<User>();
  delete = output<User>();

  userToDelete = signal<User | null>(null);

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
