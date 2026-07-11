import { Page, expect } from '@playwright/test';

export class ChatPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/chats');
  }

  async openCreateRoomForm() {
    await this.page.locator('h2:has-text("Chats")').locator('..').locator('button').click();
  }

  async fillRoomName(name: string) {
    await this.page.getByPlaceholder('Room Name').fill(name);
  }

  async selectUserForNewRoom(userName: string) {
    await this.page.locator('label', { hasText: userName }).locator('input[type="checkbox"]').check();
  }

  async clickCreateRoom() {
    const btn = this.page.getByRole('button', { name: 'Create', exact: true });
    await this.page.waitForTimeout(500);
    const disabled = await btn.isDisabled();
    console.log('--- Is Create button disabled? ---', disabled);
    const roomName = await this.page.getByPlaceholder('Room Name').inputValue();
    console.log('Room Name input:', roomName);
    const checkboxes = await this.page.locator('input[type="checkbox"]').all();
    for (let i = 0; i < checkboxes.length; i++) {
      console.log(`Checkbox ${i} checked?`, await checkboxes[i].isChecked());
    }
    await btn.click({ force: true });
  }

  async selectRoom(roomName: string) {
    await this.page.locator('h4', { hasText: roomName }).click();
  }

  async typeMessage(message: string) {
    const input = this.page.getByPlaceholder('Type a message...');
    await input.click();
    await input.fill(message);
  }

  async sendMessage() {
    const button = this.page.locator('button[type="submit"]');
    await expect(button).toBeEnabled({ timeout: 5000 });
    await button.click();
  }

  async openAddUserModal() {
    await this.page.getByTitle('Add User').click();
  }

  async searchUserToAdd(query: string) {
    await this.page.getByPlaceholder('Search users...').fill(query);
  }

  async selectUserToAdd(userName: string) {
    await this.page.locator('label', { hasText: userName }).locator('input[type="checkbox"]').check();
  }

  async submitAddUsers() {
    await this.page.getByRole('button', { name: 'Add Selected Users' }).click();
  }

  getMessageLocator(messageText: string) {
    return this.page.getByText(messageText);
  }
}
