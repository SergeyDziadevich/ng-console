import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 05 — Native Federation Integration', () => {
  const ctx = createTestContext();

  test('F05-TC1: should maintain a valid federation manifest with correct remoteEntry endpoints', async () => {
    const manifest = ctx.mfe.getManifest();
    expect(Object.keys(manifest).length).toBe(6);
    expect(manifest['users-mfe']).toContain('remoteEntry.json');
  });

  test('F05-TC2: should share Angular core packages as singletons across shell and remotes', async () => {
    const singletons = ctx.mfe.getSharedSingletons();
    expect(singletons).toContain('@angular/core');
    expect(singletons).toContain('@angular/common');
    expect(singletons).toContain('@angular/router');
    expect(singletons).toContain('rxjs');
  });

  test('F05-TC3: should dynamically load remote modules with pure ESM import maps', async () => {
    const loadResult = await ctx.mfe.loadRemoteModule('tickets-mfe', './Routes');
    expect(loadResult.loaded).toBeTruthy();
    expect(loadResult.sharedPackagesUsed.length).toBeGreaterThan(5);
  });

  test('F05-TC4: should share @ng-console/shared packages without duplication', async () => {
    const isShared = ctx.mfe.isSharedSingleton('@ng-console/shared/models');
    expect(isShared).toBeTruthy();
  });

  test('F05-TC5: should trigger fallback error boundary when a remote is offline', async () => {
    ctx.mfe.setRemoteStatus('payments-mfe', 'OFFLINE');
    const loadResult = await ctx.mfe.loadRemoteModule('payments-mfe', './Routes');
    expect(loadResult.loaded).toBeFalsy();
    expect(loadResult.fallbackTriggered).toBeTruthy();

    // Reset status back to online
    ctx.mfe.setRemoteStatus('payments-mfe', 'ONLINE');
  });
});
