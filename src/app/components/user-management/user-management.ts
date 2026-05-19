import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-user-management',
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement {
  private http = inject(HttpClient);
  userService = inject(UserService);

  users = signal<User[]>(this.userService.users());

  msg = signal<string>('');
  msg$ = this.userService.msg$;
  users$ = this.userService.users$;

  editUser(user: User) {
    console.log('editUser:', user);
  }

  deleteUser(user: User) {
    console.log('deleteUser:', user);
  }
}
