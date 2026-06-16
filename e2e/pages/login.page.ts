import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[formControlName="name"]');
    this.passwordInput = page.locator('input[formControlName="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(name: string, password = 'password') {
    await this.nameInput.fill(name);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
