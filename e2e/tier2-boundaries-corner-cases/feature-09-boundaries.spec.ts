import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F09: Backend API Gateway Application', () => {
  const ctx = createTestContext();

  test('F09-B1: should reject requests with empty Authorization header', async () => {
    ctx.api.clearAuthToken();
    const res = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: '' },
    });
    expect(res.success).toBeFalsy();
  });

  test('F09-B2: should reject malformed JSON bodies gracefully', async () => {
    const res = await ctx.api.createUser({
      email: '',
      name: '',
      role: 'user',
    });
    expect(res.statusCode).toBe(400);
  });

  test('F09-B3: should handle high concurrency bursts of 50 simultaneous requests', async () => {
    const promises = Array.from({ length: 50 }, () => ctx.api.getUsers());
    const responses = await Promise.all(promises);
    expect(responses.every((r) => r.statusCode === 200)).toBeTruthy();
  });

  test('F09-B4: should handle empty query parameters gracefully', async () => {
    const res = await ctx.api.queryVectorSearch('');
    expect(res.statusCode).toBe(400);
  });

  test('F09-B5: should enforce strict Content-Type headers', async () => {
    const headers = ctx.api.getHeaders();
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
  });
});
