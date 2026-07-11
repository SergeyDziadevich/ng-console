import { Page, expect } from '@playwright/test';
import { UserListPage } from '../pages/user-list.page';
import { CreateUserPage } from '../pages/create-user.page';
import { LoginPage } from '../pages/login.page';

export class UserFlow {
  readonly page: Page;
  readonly userList: UserListPage;
  readonly createUser: CreateUserPage;
  readonly loginPage: LoginPage;

  constructor(page: Page) {
    this.page = page;
    this.userList = new UserListPage(page);
    this.createUser = new CreateUserPage(page);
    this.loginPage = new LoginPage(page);
  }

  async addUser(data: { name: string, email: string, password?: string, role?: string }) {
    // Explicitly login first to avoid redirect race conditions
    await this.loginPage.goto();
    await this.loginPage.login('test-user@gmail.com', '12345678');

    // Wait for the login to complete and redirect away from /login
    await this.page.waitForURL(url => !url.toString().includes('/login'));

    await this.userList.goto();
    await this.userList.clickAddUser();

    // Ensure we navigated to the create page
    await expect(this.page).toHaveURL(/.*\/user-management\/add-user/);

    await this.createUser.fillForm(data);

    // Wait for the backend cache (500ms TTL) to expire from our initial visit to /user-management
    // before we submit and trigger a redirect that fetches the list again.
    await this.page.waitForTimeout(600);

    await this.createUser.submit();

    // Verify toast message
    const toast = this.page.locator('app-toast');
    await expect(toast).toContainText('User added successfully!');

    // Wait for redirect to user list
    await expect(this.page).toHaveURL(/.*\/user-management(?:\?.*)?$/);

    // Wait for backend Kafka processing to persist the user
    await this.page.waitForTimeout(3000);

    // Force reload the page to ensure we see the updated list
    await this.page.reload();

    // Select "All" page size to ensure the user is visible regardless of pagination
    await this.page.selectOption('select', 'all');

    // Verify the user exists in the list using an auto-retrying locator
    const userRow = this.page.locator('table tbody tr', { hasText: data.email });
    await expect(userRow).toBeVisible({ timeout: 10000 });
  }

  async removeUser(email: string) {
    if (!this.page.url().includes('/user-management')) {
      await this.userList.goto();
      await this.page.waitForTimeout(600);
    }

    // Select "All" page size to ensure the user is visible regardless of pagination
    await this.page.selectOption('select', 'all');

    const userRow = this.page.locator('table tbody tr', { hasText: email });
    await expect(userRow).toBeVisible({ timeout: 10000 });

    const deleteButton = userRow.locator('button[title="Delete"]');
    await deleteButton.click();

    const confirmButton = this.page.locator('app-confirm-dialog button.btn-confirm');
    await confirmButton.click();

    const toast = this.page.locator('app-toast');
    await expect(toast).toContainText('User deleted successfully');

    await expect(userRow).toBeHidden({ timeout: 10000 });
  }
}
