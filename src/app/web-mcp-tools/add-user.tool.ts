import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../services/user-service';
import { AuthService } from '../services/auth.service';
import { CreateUser } from '../models/user.model';
import { UserRole } from '../enums/user-role.enum';

interface AddUserArgs {
  username: string;
  email: string;
  password: string;
  role: string;
  displayName?: string;
}

export const addUserTool = {
  name: 'add_user',
  description: 'Adds a new user to the system. (Admin only)',
  inputSchema: {
    type: 'object',
    properties: {
      username: { type: 'string', description: 'The username of the new user.' },
      email: { type: 'string', description: 'The email address of the new user.' },
      password: {
        type: 'string',
        description: 'The password for the new user (min 8 characters).',
      },
      role: {
        type: 'string',
        enum: ['admin', 'moderator', 'user'],
        description: 'The role of the new user.',
      },
      displayName: { type: 'string', description: 'Optional display name.' },
    },
    required: ['username', 'email', 'password', 'role'],
  } as const,
  execute: async (args: AddUserArgs) => {
    const authService = inject(AuthService);
    const currentUser = authService.currentUser();

    if (currentUser?.role !== 'admin') {
      return {
        content: [
          {
            type: 'text',
            text: 'Access Denied: You do not have permission to add users. This action requires administrative privileges.',
          },
        ],
        isError: true,
      };
    }

    const userService = inject(UserService);
    try {
      const createUserData: CreateUser = { ...args, role: args.role as UserRole };
      const user = await firstValueFrom(userService.createUser(createUserData));
      userService.usersResource.reload();
      return {
        content: [
          {
            type: 'text',
            text: `Successfully added user: ${user.username} (${user.email}) with role ${user.role}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to add user: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};
