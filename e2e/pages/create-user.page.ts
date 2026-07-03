import { Page, Locator } from '@playwright/test';

export class CreateUserPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input#add-name');
    this.emailInput = page.locator('input#add-email');
    this.passwordInput = page.locator('input#add-password');
    this.roleSelect = page.locator('select#add-role');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async fillForm(data: { name: string, email: string, password?: string, role?: string }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    if (data.password) {
      await this.passwordInput.fill(data.password);
    } else {
      await this.passwordInput.fill('password123');
    }
    if (data.role) {
      await this.roleSelect.selectOption(data.role);
    }
  }

  async submit() {
    await this.submitButton.click();
  }
}
