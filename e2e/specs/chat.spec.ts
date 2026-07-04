import { test } from '@playwright/test';
import { UserFlow } from '../flows/user.flow';
import { ChatFlow } from '../flows/chat.flow';

test.describe('Chat Business Logic', () => {
  test('should be able to create a chat room, select it, and send a message', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('request', req => {
      if (req.url().includes('/api/chats/rooms')) {
        console.log('REQUEST:', req.method(), req.url());
      }
    });
    page.on('response', resp => {
      if (resp.url().includes('/api/chats/rooms')) {
        console.log('RESPONSE:', resp.request().method(), resp.url(), resp.status());
      }
    });

    const userFlow = new UserFlow(page);
    const chatFlow = new ChatFlow(page);
    
    const uniqueSuffix = Date.now();
    const uniqueEmail = `e2e.chatuser.${uniqueSuffix}@example.com`;
    const userName = `E2E Chat User ${uniqueSuffix}`;

    // Re-use UserFlow to add a user (this handles login as test-user)
    await userFlow.addUser({
      name: userName,
      email: uniqueEmail,
      password: 'password123',
      role: 'user'
    });

    // We should now be logged in, so we can navigate to the chat page
    await chatFlow.createRoomAndSendMessage(`Test Room ${uniqueSuffix}`, userName, 'Hello E2E Chat!');
  });
});
