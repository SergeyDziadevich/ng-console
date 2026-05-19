import { Injectable, signal, Signal } from '@angular/core';
import { mockUsers } from '../mocks/users-mock';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  users: Signal<User[]> = signal(mockUsers);
}
