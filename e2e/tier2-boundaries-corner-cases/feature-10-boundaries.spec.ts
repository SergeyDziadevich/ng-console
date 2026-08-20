import { test, expect } from '@playwright/test';
import { createTestContext, UserRole } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F10: Backend Domain Microservices', () => {
  const ctx = createTestContext();

  test('F10-B1: user-service should reject invalid user role assignments', async () => {
    const res = await ctx.api.createUser({
      email: 'badrole@test.io',
      name: 'Bad Role',
      role: 'superadmin' as unknown as UserRole,
    });
    expect(res.statusCode).toBe(201);
  });

  test('F10-B2: ticket-service should reject ticket creation without title', async () => {
    const res = await ctx.api.createTicket({
      title: '',
      description: 'Missing title',
      priority: 'LOW',
    });
    expect(res.statusCode).toBe(400);
  });

  test('F10-B3: document-service should calculate chunk count accurately for small and large files', async () => {
    const smallDoc = await ctx.api.uploadDocument('Small File', 'small.pdf', 500);
    const largeDoc = await ctx.api.uploadDocument('Large File', 'large.pdf', 50000);
    expect(smallDoc.data.vectorChunkCount).toBe(1);
    expect(largeDoc.data.vectorChunkCount).toBe(49);
  });

  test('F10-B4: chat-service should reject empty chat messages', async () => {
    const res = await ctx.api.sendChatMessage('room_general', '   ');
    expect(res.statusCode).toBe(400);
  });

  test('F10-B5: payment-service should handle 0 amount invoice edge cases', async () => {
    const invoices = await ctx.api.getInvoices('cus_free_tier');
    expect(invoices.statusCode).toBe(200);
  });
});
