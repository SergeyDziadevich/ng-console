import { test, expect } from '@playwright/test';
import { AiAssistantFlow } from '../flows/ai-assistant.flow';

test.describe('AI Assistant Feature E2E', () => {
  let flow: AiAssistantFlow;

  test.beforeEach(async ({ page }) => {
    flow = new AiAssistantFlow(page);
    await flow.loginAndNavigate();
  });

  test('should render AI Assistant page header and initial starter suggestions', async () => {
    await expect(flow.aiPage.getHeaderTitle()).toBeVisible();

    const listUsersSuggestion = flow.aiPage.getSuggestionButton('List Registered Users');
    const weatherSuggestion = flow.aiPage.getSuggestionButton('Check Weather Forecast');
    const docSuggestion = flow.aiPage.getSuggestionButton('Search System Documents');

    await expect(listUsersSuggestion).toBeVisible();
    await expect(weatherSuggestion).toBeVisible();
    await expect(docSuggestion).toBeVisible();
  });

  test('should send a user prompt and display the AI assistant response', async () => {
    const mockReply = 'Hello! I am your AI Assistant. How can I help you today?';
    await flow.mockAiResponse({ text: mockReply });

    await flow.sendPrompt('Hello AI!');

    // Check user prompt appears
    await expect(flow.aiPage.getMessageByText('Hello AI!')).toBeVisible();

    // Check model response appears
    await expect(flow.aiPage.getMessageByText(mockReply)).toBeVisible({ timeout: 10000 });
  });

  test('should trigger prompt when clicking a starter suggestion card', async () => {
    const mockReply = 'Here is the weather forecast for Berlin.';
    await flow.mockAiResponse({ text: mockReply });

    const weatherCard = flow.aiPage.getSuggestionButton('Check Weather Forecast');
    await weatherCard.click();

    // Check model response appears
    await expect(flow.aiPage.getMessageByText(mockReply)).toBeVisible({ timeout: 10000 });
  });

  test('should render users widget when response includes users list header', async () => {
    const mockUsersResponse = 'Here is the list of all users:\n1. Admin (admin@example.com)';
    await flow.mockAiResponse({ text: mockUsersResponse });

    await flow.sendPrompt('List all users');

    await expect(flow.aiPage.getUsersWidget()).toBeVisible({ timeout: 10000 });
  });

  test('should render weather widget when response contains weather JSON data', async () => {
    const mockWeatherResponse = JSON.stringify({
      type: 'weatherWidget',
      city: 'Berlin',
      temp: 22,
      condition: 'Sunny',
      humidity: 50,
      windSpeed: '12 km/h',
    });
    await flow.mockAiResponse({ text: mockWeatherResponse });

    await flow.sendPrompt('What is the weather in Berlin?');

    await expect(flow.aiPage.getWeatherWidget()).toBeVisible({ timeout: 10000 });
  });

  test('should render document widget when response contains documentWidget JSON data', async () => {
    const mockDocResponse = JSON.stringify({
      type: 'documentWidget',
      documents: [
        {
          id: 'doc1',
          filename: 'security-policy.pdf',
          snippet: 'Security policy details for data protection.',
          similarity: 0.95,
        },
      ],
    });
    await flow.mockAiResponse({ text: mockDocResponse });

    await flow.sendPrompt('Search documents for security policy');

    await expect(flow.aiPage.getDocumentWidget()).toBeVisible({ timeout: 10000 });
  });

  test('should display error banner on API error', async () => {
    await flow.mockAiErrorResponse(500);

    await flow.sendPrompt('Test error scenario');

    const errorBanner = flow.page.getByRole('alert');
    await expect(errorBanner).toContainText('Failed to get a response. Please try again.', {
      timeout: 10000,
    });
  });

  test('should clear chat messages when clicking Clear button', async () => {
    const mockReply = 'Some chat response to clear';
    await flow.mockAiResponse({ text: mockReply });

    await flow.sendPrompt('Test prompt to clear');
    await expect(flow.aiPage.getMessageByText(mockReply)).toBeVisible({ timeout: 10000 });

    await flow.aiPage.clickClearChat();

    // Verify messages are removed and starter suggestions reappear
    await expect(flow.aiPage.getMessageByText(mockReply)).toBeHidden();
    await expect(flow.aiPage.getSuggestionButton('List Registered Users')).toBeVisible();
  });
});
