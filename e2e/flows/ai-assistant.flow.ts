import { Page, expect } from '@playwright/test';
import { AiAssistantPage } from '../pages/ai-assistant.page';
import { LoginPage } from '../pages/login.page';

export class AiAssistantFlow {
  readonly page: Page;
  readonly aiPage: AiAssistantPage;
  readonly loginPage: LoginPage;

  constructor(page: Page) {
    this.page = page;
    this.aiPage = new AiAssistantPage(page);
    this.loginPage = new LoginPage(page);
  }

  async loginAndNavigate() {
    await this.loginPage.goto();
    await this.loginPage.login('test-user@gmail.com', '12345678');
    await this.page.waitForURL((url) => !url.toString().includes('/login'));

    await this.aiPage.goto();
    await expect(this.aiPage.getHeaderTitle()).toBeVisible({ timeout: 10000 });
  }

  async mockAiResponse(responsePayload: { text: string }) {
    await this.page.route('**/api/ai/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responsePayload),
      });
    });
  }

  async mockAiErrorResponse(status = 500) {
    await this.page.route('**/api/ai/generate', async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
  }

  async sendPrompt(prompt: string) {
    await this.aiPage.typeMessage(prompt);
    await this.aiPage.sendMessage();
  }
}
