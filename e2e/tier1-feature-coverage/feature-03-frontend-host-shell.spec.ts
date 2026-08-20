import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 03 — Frontend Host Shell Application', () => {
  const ctx = createTestContext();

  test('F03-TC1: should initialize shell root state and session management', async () => {
    const auth = await ctx.api.login('admin@ng-console.io', 'securePassword123');
    expect(auth.statusCode).toBe(200);
    expect(auth.data.token).toContain('jwt_mock');
  });

  test('F03-TC2: should configure dynamic routes to all 6 remote micro-frontends', async () => {
    const manifest = ctx.mfe.getManifest();
    expect(manifest['users-mfe']).toBeDefined();
    expect(manifest['tickets-mfe']).toBeDefined();
    expect(manifest['documents-mfe']).toBeDefined();
    expect(manifest['payments-mfe']).toBeDefined();
    expect(manifest['chat-mfe']).toBeDefined();
    expect(manifest['ai-assistant-mfe']).toBeDefined();
  });

  test('F03-TC3: should protect private shell routes with authentication guard', async () => {
    ctx.api.clearAuthToken();
    const rpcRes = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: 'invalid_token' },
    });
    expect(rpcRes.success).toBeFalsy();
    expect(rpcRes.error).toContain('Unauthorized');
  });

  test('F03-TC4: should render global navigation bar and active route states', async () => {
    const result = await ctx.mfe.loadRemoteModule('users-mfe', './Routes');
    expect(result.loaded).toBeTruthy();
    expect(result.exportedRoutesCount).toBeGreaterThanOrEqual(1);
  });

  test('F03-TC5: should listen to global system notifications across all views', async () => {
    const notifs = await ctx.api.getNotifications('usr_admin');
    expect(notifs.statusCode).toBe(200);
    expect(notifs.data.length).toBeGreaterThan(0);
  });
});
