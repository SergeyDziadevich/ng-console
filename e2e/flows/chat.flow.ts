import { Page, expect } from '@playwright/test';
import { ChatPage } from '../pages/chat.page';
import { LoginPage } from '../pages/login.page';

export class ChatFlow {
  readonly page: Page;
  readonly chatPage: ChatPage;
  readonly loginPage: LoginPage;

  constructor(page: Page) {
    this.page = page;
    this.chatPage = new ChatPage(page);
    this.loginPage = new LoginPage(page);
  }

  async createRoomAndSendMessage(roomName: string, userName: string, message: string) {
    await this.chatPage.goto();

    await this.chatPage.openCreateRoomForm();
    await this.chatPage.fillRoomName(roomName);
    
    // Sometimes the user list might take a moment to load
    await this.page.waitForTimeout(1000);
    await this.chatPage.selectUserForNewRoom(userName);

    await this.chatPage.clickCreateRoom();

    // Wait for the room to be created and selectable
    await this.page.waitForTimeout(2000);
    await this.chatPage.selectRoom(roomName);

    // Send a message
    await this.chatPage.typeMessage(message);
    await this.chatPage.sendMessage();

    // Verify message appears
    const msgLoc = this.chatPage.getMessageLocator(message);
    await expect(msgLoc).toBeVisible({ timeout: 10000 });
  }
}
