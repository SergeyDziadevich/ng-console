import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F11: Synchronous RPC Transports', () => {
  const ctx = createTestContext();

  test('F11-B1: should handle high volume of sequential RPC requests', async () => {
    for (let i = 0; i < 20; i++) {
      const res = await ctx.rpc.send({ pattern: 'users.find_all', data: {} });
      expect(res.success).toBeTruthy();
    }
  });

  test('F11-B2: should reject null payload when object is required', async () => {
    const res = await ctx.rpc.send({
      pattern: 'users.find_by_id',
      data: null,
    });
    expect(res.success).toBeFalsy();
  });

  test('F11-B3: should handle custom registered pattern dynamically', async () => {
    ctx.rpc.registerHandler('custom.ping', () => ({ pong: true }));
    const res = await ctx.rpc.send({ pattern: 'custom.ping', data: {} });
    expect(res.success).toBeTruthy();
    expect((res.result as { pong: boolean })?.pong).toBe(true);
  });

  test('F11-B4: should propagate custom error messages from handlers', async () => {
    ctx.rpc.registerHandler('error.trigger', () => {
      throw new Error('Database connection failed');
    });
    const res = await ctx.rpc.send({ pattern: 'error.trigger', data: {} });
    expect(res.success).toBeFalsy();
    expect(res.error).toBe('Database connection failed');
  });

  test('F11-B5: should maintain message pattern registry consistency', async () => {
    expect(ctx.rpc.hasPattern('auth.login')).toBeTruthy();
    expect(ctx.rpc.hasPattern('non.existent')).toBeFalsy();
  });
});
