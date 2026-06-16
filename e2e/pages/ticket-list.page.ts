import { Page, Locator } from '@playwright/test';

export class TicketListPage {
  readonly page: Page;
  readonly addTicketButton: Locator;
  readonly ticketCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTicketButton = page.locator('text=Add Ticket');
    this.ticketCards = page.locator('.bg-white.rounded-lg.shadow'); // Selector based on the ticket card class
  }

  async goto() {
    await this.page.goto('/tickets');
  }

  async clickAddTicket() {
    await this.addTicketButton.click();
  }

  async getTicketTitles() {
    return this.page.locator('.bg-white.rounded-lg.shadow h3').allTextContents();
  }
}
