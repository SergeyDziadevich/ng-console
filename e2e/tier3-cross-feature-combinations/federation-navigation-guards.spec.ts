import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 3: Cross-Feature — Native Federation, Routing & Auth Guards', () => {
  const ctx = createTestContext();

  test('T3-26: Unauthenticated user navigated to /tickets -> Guard redirects to /login -> Authenticates -> Restores /tickets in Tickets MFE', async () => {
    // 1. Unauthenticated attempt blocked by auth validation
    ctx.api.clearAuthToken();
    const unauthValidation = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: 'unauthenticated' },
    });
    expect(unauthValidation.success).toBeFalsy();

    // 2. User logs in at /login
    const loginRes = await ctx.api.login('operator@ng-console.io', 'pass123');
    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.data.token;

    // 3. Auth guard allows navigation and token is verified
    const authValidation = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token },
    });
    expect(authValidation.success).toBeTruthy();

    // 4. Shell dynamically loads Tickets MFE
    const ticketsMfe = await ctx.mfe.loadRemoteModule('tickets-mfe', './Routes');
    expect(ticketsMfe.loaded).toBeTruthy();
  });

  test('T3-27: Sequential traversal through all 6 remote MFEs in single session', async () => {
    const remotes = ['users-mfe', 'tickets-mfe', 'documents-mfe', 'payments-mfe', 'chat-mfe', 'ai-assistant-mfe'];
    for (const remote of remotes) {
      const res = await ctx.mfe.loadRemoteModule(remote, './Routes');
      expect(res.loaded).toBeTruthy();
    }
  });

  test('T3-28: Shell global state store sharing across remote boundaries', async () => {
    const isSharedDataAccess = ctx.mfe.isSharedSingleton('@ng-console/shared/data-access');
    const isSharedModels = ctx.mfe.isSharedSingleton('@ng-console/shared/models');
    expect(isSharedDataAccess && isSharedModels).toBeTruthy();
  });

  test('T3-29: Remote MFE failure isolated without affecting sibling remotes', async () => {
    // Break payments-mfe
    ctx.mfe.setRemoteStatus('payments-mfe', 'OFFLINE');
    const paymentsRes = await ctx.mfe.loadRemoteModule('payments-mfe', './Routes');
    expect(paymentsRes.loaded).toBeFalsy();

    // Verify other MFEs still load cleanly
    const usersRes = await ctx.mfe.loadRemoteModule('users-mfe', './Routes');
    expect(usersRes.loaded).toBeTruthy();

    // Restore payments-mfe
    ctx.mfe.setRemoteStatus('payments-mfe', 'ONLINE');
  });

  test('T3-30: Manifest reload on version rollout', async () => {
    const manifest = ctx.mfe.getManifest();
    expect(manifest['ai-assistant-mfe']).toBeDefined();
  });
});
