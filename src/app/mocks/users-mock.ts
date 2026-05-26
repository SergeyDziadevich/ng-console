import { UserRole } from '../enums/user-role.enum';

export const mockUsers = [
  {
    _id: '1432432',
    email: 'some@email.com',
    password: 'admin123',
    username: 'admin',
    displayName: 'Admin ',
    role: UserRole.Admin,
    settings: '',
  },
  {
    _id: '2432432',
    email: 'john@email.com',
    password: '123456',
    username: 'John',
    displayName: 'John',
    role: UserRole.User,
    settings: '',
  },
  {
    _id: '3432432',
    email: 'billg@gmail.com',
    password: '123456',
    displayName: 'Bill',
    username: 'Bill',
    role: UserRole.Moderator,
    settings: '',
  },
  {
    _id: '4432432',
    email: 'billie@gmail.com',
    password: '123456',
    displayName: 'Billie',
    username: 'Billie',
    role: UserRole.Admin,
    settings: '',
  },
];
