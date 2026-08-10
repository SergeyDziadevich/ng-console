import { Page, expect } from '@playwright/test';

export class AiAssistantPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/ai-assistant');
  }

  getHeaderTitle() {
    return this.page.locator('h1', { hasText: 'AI Assistant' });
  }

  getClearButton() {
    return this.page.getByRole('button', { name: 'Clear' });
  }

  getSuggestionButton(title: string) {
    return this.page.locator('button', { hasText: title });
  }

  getMessageInput() {
    return this.page.getByPlaceholder('Ask anything about users, weather, or documents...');
  }

  getSendButton() {
    return this.page.getByRole('button', { name: 'Send', exact: false });
  }

  getLogContainer() {
    return this.page.locator('[role="log"]');
  }

  getThinkingIndicator() {
    return this.page.getByText('AI Assistant is thinking...');
  }

  getMessageByText(text: string) {
    return this.page.locator('[role="log"]').getByText(text);
  }

  getUsersWidget() {
    return this.page.locator('app-users-widget');
  }

  getWeatherWidget() {
    return this.page.locator('app-weather-widget');
  }

  getDocumentWidget() {
    return this.page.locator('app-document-widget');
  }

  async typeMessage(prompt: string) {
    const input = this.getMessageInput();
    await input.click();
    await input.fill(prompt);
  }

  async sendMessage() {
    const btn = this.getSendButton();
    await expect(btn).toBeEnabled({ timeout: 5000 });
    await btn.click();
  }

  async clickClearChat() {
    await this.getClearButton().click();
  }
}
