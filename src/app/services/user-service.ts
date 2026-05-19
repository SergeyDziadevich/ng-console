import { inject, Injectable, signal, Signal } from '@angular/core';
import { mockUsers } from '../mocks/users-mock';
import { User } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  httpClient = inject(HttpClient);

  users: Signal<User[]> = signal(mockUsers);

  msg$ = this.httpClient.get<{ msg: string }>(`${environment.apiUrl}/`);
  users$ = this.httpClient.get<User[]>(`${environment.apiUrl}/api/users`);
}
