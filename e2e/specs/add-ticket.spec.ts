import { test, expect } from '@playwright/test';
import { TicketFlow } from '../flows/ticket.flow';

test.describe('Ticket Management', () => {
  test('should be able to add a new ticket', async ({ page }) => {
    // If authentication is required in this app, you might need to login first.
    // e.g. await page.goto('/login');
    // await page.fill('input[name="username"]', 'admin');
    // await page.fill('input[name="password"]', 'password');
    // await page.click('button[type="submit"]');
    // await expect(page).toHaveURL(/.*\/dashboard/);

    const ticketFlow = new TicketFlow(page);
    
    const uniqueTitle = `E2E Test Ticket ${Date.now()}`;

    await ticketFlow.addTicket({
      title: uniqueTitle,
      about: 'This ticket was created by an automated e2e test.',
      description: 'E2E testing description text goes here.',
    });
  });
});
