import { Page, Locator } from '@playwright/test';

export class UserListPage {
  readonly page: Page;
  readonly addUserButton: Locator;
  readonly userRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addUserButton = page.locator('a:has-text("Add User")');
    this.userRows = page.locator('table tbody tr'); 
  }

  async goto() {
    await this.page.goto('/user-management');
  }

  async clickAddUser() {
    await this.addUserButton.click();
  }

  async getUserNames() {
    return this.page.locator('table tbody tr td:nth-child(2)').allTextContents();
  }
}
