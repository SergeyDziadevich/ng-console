import { UserRole } from '../enums/user-role.enum';

export interface User {
  _id: string;
  username: string;
  displayName?: string;
  email: string;
  password: string;
  role: UserRole;
  settings?: string;
  avatarUrl?: string;
}

export type CreateUser = Omit<User, '_id'>;
export type UpdateUser = Partial<Omit<User, '_id' | 'password'>>;
