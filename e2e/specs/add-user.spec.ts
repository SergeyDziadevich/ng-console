import { test } from '@playwright/test';
import { UserFlow } from '../flows/user.flow';

test.describe('User Management', () => {
  test('should be able to add a new user', async ({ page }) => {
    const userFlow = new UserFlow(page);
    
    const uniqueSuffix = Date.now();
    const uniqueEmail = `e2e.user.${uniqueSuffix}@example.com`;

    await userFlow.addUser({
      name: `E2E Test User ${uniqueSuffix}`,
      email: uniqueEmail,
      password: 'password123',
      role: 'admin'
    });

    // Clean up the created user
    await userFlow.removeUser(uniqueEmail);
  });
});
