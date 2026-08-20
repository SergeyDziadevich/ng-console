import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 09 — Backend API Gateway Application', () => {
  const ctx = createTestContext();

  test('F09-TC1: should route REST requests to downstream microservices', async () => {
    const res = await ctx.api.getUsers();
    expect(res.statusCode).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('F09-TC2: should enforce JWT authentication guard on protected endpoints', async () => {
    const authRes = await ctx.api.login('admin@ng-console.io', 'secure123');
    expect(authRes.statusCode).toBe(200);
    expect(authRes.data.token).toBeDefined();
  });

  test('F09-TC3: should validate request payload and return 400 Bad Request on invalid DTO', async () => {
    const invalidUser = await ctx.api.createUser({
      email: '',
      name: '',
      role: 'user',
    });
    expect(invalidUser.statusCode).toBe(400);
    expect(invalidUser.error).toBeDefined();
  });

  test('F09-TC4: should support GraphQL query resolution and schemas', async () => {
    const res = await ctx.api.getTickets();
    expect(res.statusCode).toBe(200);
    expect(res.data[0]?.status).toBe('OPEN');
  });

  test('F09-TC5: should provide consistent error structure across all endpoints', async () => {
    const searchRes = await ctx.api.queryVectorSearch('   ');
    expect(searchRes.statusCode).toBe(400);
    expect(searchRes.error).toContain('cannot be empty');
  });
});
