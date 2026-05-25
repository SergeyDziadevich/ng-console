import { inject, Injectable, signal, Signal } from '@angular/core';
import { mockUsers } from '../mocks/users-mock';
import { CreateUser, UpdateUser, User } from '../models/user.model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface UserFilter {
  filter?: string;
  value?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);

  users: Signal<User[]> = signal(mockUsers);
  users$ = this.httpClient.get<User[]>(`${environment.apiUrl}/api/users`);

  readonly filterParams = signal<UserFilter>({});

  usersResource = httpResource<User[]>(() => {
    const { filter, value } = this.filterParams();
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (value) params.set('value', value);
    const query = params.toString();
    return `${environment.apiUrl}/api/users${query ? '?' + query : ''}`;
  });

  createUser(user: CreateUser): Observable<User> {
    return this.httpClient.post<User>(`${environment.apiUrl}/api/users`, user);
  }

  deleteUser(id: string) {
    return this.httpClient.delete<void>(`${environment.apiUrl}/api/users/${id}`);
  }

  updateUser(id: string, user: UpdateUser): Observable<User> {
    return this.httpClient.patch<User>(`${environment.apiUrl}/api/users/${id}`, user);
  }
}
