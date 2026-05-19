import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersTable } from './users-table/users-table';

@Component({
  selector: 'app-user-management',
  imports: [UsersTable],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement {
  userService = inject(UserService);

  usersResource = this.userService.usersResource;
  users = toSignal(this.userService.users$);

  editUser(user: User) {
    console.log('editUser:', user);
  }

  deleteUser(user: User) {
    console.log('deleteUser:', user);
  }
}
