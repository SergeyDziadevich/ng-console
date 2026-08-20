import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F02: Frontend Shared Libraries', () => {
  const ctx = createTestContext();

  test('F02-B1: should reject user creation with empty string email and name', async () => {
    const res = await ctx.api.createUser({ email: '', name: '', role: 'user' });
    expect(res.statusCode).toBe(400);
    expect(res.error).toBeDefined();
  });

  test('F02-B2: should handle massive string inputs (10,000 characters) in ticket description', async () => {
    const hugeDescription = 'A'.repeat(10000);
    const res = await ctx.api.createTicket({
      title: 'Large Payload Ticket',
      description: hugeDescription,
      priority: 'MEDIUM',
    });
    expect(res.statusCode).toBe(201);
    expect(res.data.description.length).toBe(10000);
  });

  test('F02-B3: should handle Unicode and multi-byte characters in user name', async () => {
    const unicodeName = 'こんにちは 世界 🚀 Über ña';
    const res = await ctx.api.createUser({
      email: 'unicode@test.io',
      name: unicodeName,
      role: 'user',
    });
    expect(res.statusCode).toBe(201);
    expect(res.data.name).toBe(unicodeName);
  });

  test('F02-B4: should handle empty tags array in createTicket DTO', async () => {
    const res = await ctx.api.createTicket({
      title: 'No Tags Ticket',
      description: 'Ticket without tags',
      priority: 'LOW',
      tags: [],
    });
    expect(res.statusCode).toBe(201);
    expect(res.data.tags).toEqual([]);
  });

  test('F02-B5: should handle undefined optional fields gracefully without NPE', async () => {
    const res = await ctx.api.updateUser('usr_test', {});
    expect(res.statusCode).toBe(200);
    expect(res.data.id).toBe('usr_test');
  });
});
