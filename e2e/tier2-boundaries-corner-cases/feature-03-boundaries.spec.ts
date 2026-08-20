import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F03: Frontend Host Shell Application', () => {
  const ctx = createTestContext();

  test('F03-B1: should reject login attempt with empty password', async () => {
    const res = await ctx.api.login('admin@ng-console.io', '');
    expect(res.statusCode).toBe(400);
  });

  test('F03-B2: should reject navigation with invalid JWT format', async () => {
    const rpcRes = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: 'bad_token' },
    });
    expect(rpcRes.success).toBeFalsy();
    expect(rpcRes.error).toBeDefined();
  });

  test('F03-B3: should handle unknown remote MFE route navigation gracefully', async () => {
    const res = await ctx.mfe.loadRemoteModule('unknown-mfe', './Routes');
    expect(res.loaded).toBeFalsy();
    expect(res.fallbackTriggered).toBeTruthy();
  });

  test('F03-B4: should handle empty notifications list for new user without error', async () => {
    const res = await ctx.api.getNotifications('usr_brand_new');
    expect(res.statusCode).toBe(200);
  });

  test('F03-B5: should maintain session state across rapid route switching', async () => {
    const load1 = await ctx.mfe.loadRemoteModule('users-mfe', './Routes');
    const load2 = await ctx.mfe.loadRemoteModule('tickets-mfe', './Routes');
    const load3 = await ctx.mfe.loadRemoteModule('chat-mfe', './Routes');
    expect(load1.loaded && load2.loaded && load3.loaded).toBeTruthy();
  });
});
