import { inject, Injectable, signal, Signal } from '@angular/core';
import { mockUsers } from '../mocks/users-mock';
import { User } from '../models/user.model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  httpClient = inject(HttpClient);

  users: Signal<User[]> = signal(mockUsers);
  usersResource = httpResource<User[]>(() => `${environment.apiUrl}/api/users`);
  users$ = this.httpClient.get<User[]>(`${environment.apiUrl}/api/users`);

  createUser(user: User) {
    return this.httpClient.post<User>(`${environment.apiUrl}/api/users`, user);
  }
}
