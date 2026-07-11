import { Page, expect } from '@playwright/test';
import { TicketListPage } from '../pages/ticket-list.page';
import { CreateTicketPage } from '../pages/create-ticket.page';
import { LoginPage } from '../pages/login.page';

export class TicketFlow {
  readonly page: Page;
  readonly ticketList: TicketListPage;
  readonly createTicket: CreateTicketPage;
  readonly loginPage: LoginPage;

  constructor(page: Page) {
    this.page = page;
    this.ticketList = new TicketListPage(page);
    this.createTicket = new CreateTicketPage(page);
    this.loginPage = new LoginPage(page);
  }

  async addTicket(data: { title: string, about?: string, description: string }) {
    // Explicitly login first to avoid redirect race conditions
    await this.loginPage.goto();
    await this.loginPage.login('test-user@gmail.com', '12345678');

    // Wait for the login to complete and redirect away from /login
    await this.page.waitForURL(url => !url.toString().includes('/login'));

    await this.ticketList.goto();
    await this.ticketList.clickAddTicket();

    // Ensure we navigated to the create page
    await expect(this.page).toHaveURL(/.*\/tickets\/new/);

    await this.createTicket.fillForm(data);

    // Wait for the backend cache (500ms TTL) to expire from our initial visit to /tickets
    // before we submit and trigger a redirect that fetches the list again.
    await this.page.waitForTimeout(600);

    await this.createTicket.submit();

    // Verify toast message
    const toast = this.page.locator('app-toast');
    await expect(toast).toContainText('Ticket created successfully!');

    // Wait for redirect to ticket list (ensure it ends with /tickets or has query params, but not /tickets/new)
    await expect(this.page).toHaveURL(/.*\/tickets(?:\?.*)?$/);

    // Force reload the page to ensure we bypass any frontend cache or Angular httpResource quirks
    await this.page.reload();

    // Verify the ticket exists in the list using an auto-retrying locator
    const ticketCard = this.page.locator('.bg-white.rounded-lg.shadow h3', { hasText: data.title });
    await expect(ticketCard).toBeVisible();
  }
}
