import { Page, Locator } from '@playwright/test';

export class TicketListPage {
  readonly page: Page;
  readonly addTicketButton: Locator;
  readonly ticketCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTicketButton = page.locator('.add-ticket-btn');
    this.ticketCards = page.locator('.ticket-card'); // Selector based on the ticket card class
  }

  async goto() {
    await this.page.goto('/tickets');
  }

  async clickAddTicket() {
    await this.addTicketButton.click();
  }

  async getTicketTitles() {
    return this.page.locator('.ticket-card h3').allTextContents();
  }
}
