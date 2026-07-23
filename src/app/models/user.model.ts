import { UserRole } from '../enums/user-role.enum';

export interface UserSettings {
  receiveNotifications?: boolean;
  receiveEmails?: boolean;
  receiveSMS?: boolean;
  theme?: 'light' | 'dark';
}

export interface User {
  _id: string;
  username: string;
  displayName?: string;
  email: string;
  password: string;
  role: UserRole;
  settings?: UserSettings;
  avatarUrl?: string;
  isTwoFactorEnabled?: boolean;
}

export type CreateUser = Omit<User, '_id'>;
export type UpdateUser = Partial<Omit<User, '_id' | 'password'>>;
