import { Component, input, output } from '@angular/core';
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

  editUser(user: User) {
    this.edit.emit(user);
  }

  deleteUser(user: User) {
    this.delete.emit(user);
  }
}
