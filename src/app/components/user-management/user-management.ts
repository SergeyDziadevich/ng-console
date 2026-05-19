import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  imports: [],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement {
  userService = inject(UserService);
  users = signal<User[]>(this.userService.users());

  editUser(user: User) {
    console.log('editUser:', user);
  }

  deleteUser(user: User) {
    console.log('deleteUser:', user);
  }
}
