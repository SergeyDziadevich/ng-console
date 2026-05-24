import { UserRole } from '../enums/user-role.enum';

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type CreateUser = Omit<User, '_id'>;
