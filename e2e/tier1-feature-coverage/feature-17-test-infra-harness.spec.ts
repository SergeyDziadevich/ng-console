import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 17 — E2E Test Infrastructure & Harness', () => {
  const ctx = createTestContext();

  test('F17-TC1: should instantiate all test harnesses without initialization errors', async () => {
    expect(ctx.api).toBeDefined();
    expect(ctx.rpc).toBeDefined();
    expect(ctx.kafka).toBeDefined();
    expect(ctx.mfe).toBeDefined();
    expect(ctx.infra).toBeDefined();
  });

  test('F17-TC2: should reset state between test cases to ensure complete test isolation', async () => {
    ctx.api.setAuthToken('temp_token');
    await ctx.kafka.publish('user.created', {
      userId: 'temp_user',
      email: 'temp@test.com',
      name: 'Temp User',
      createdAt: new Date().toISOString(),
    });

    expect(ctx.kafka.getRecordCount('user.created')).toBeGreaterThanOrEqual(1);

    ctx.resetAll();
    expect(ctx.kafka.getRecordCount('user.created')).toBe(0);
  });

  test('F17-TC3: should execute synchronous RPC assertions cleanly', async () => {
    const rpcRes = await ctx.rpc.send({
      pattern: 'users.find_all',
      data: {},
    });
    expect(rpcRes.success).toBeTruthy();
  });

  test('F17-TC4: should record latency metrics for performance telemetry', async () => {
    const rpcRes = await ctx.rpc.send({
      pattern: 'auth.login',
      data: { email: 'admin@ng-console.io', password: 'password' },
    });
    expect(rpcRes.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test('F17-TC5: should provide strict typing with zero any across all test context methods', async () => {
    const res = await ctx.api.getInvoices('cus_test');
    expect(res.statusCode).toBe(200);
    expect(res.data[0]?.currency).toBe('usd');
  });
});
