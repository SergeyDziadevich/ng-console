import { Page, Locator } from '@playwright/test';

export class CreateTicketPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly aboutInput: Locator;
  readonly descriptionInput: Locator;
  readonly statusSelect: Locator;
  readonly prioritySelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('input#title');
    this.aboutInput = page.locator('textarea#about');
    this.descriptionInput = page.locator('textarea#description');
    this.statusSelect = page.locator('select#status');
    this.prioritySelect = page.locator('select#priority');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/tickets/new');
  }

  async fillForm(data: { title: string, about?: string, description: string, status?: string, priority?: string }) {
    await this.titleInput.fill(data.title);
    
    if (data.about) {
      await this.aboutInput.fill(data.about);
    }
    
    await this.descriptionInput.fill(data.description);
    
    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }
    
    if (data.priority) {
      await this.prioritySelect.selectOption(data.priority);
    }
  }

  async submit() {
    await this.submitButton.click();
  }
}
