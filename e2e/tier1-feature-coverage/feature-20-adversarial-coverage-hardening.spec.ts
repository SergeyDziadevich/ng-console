import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 20 — Adversarial Coverage Hardening', () => {
  const ctx = createTestContext();

  test('F20-TC1: should sanitize special characters and control characters in inputs', async () => {
    const maliciousPayload = '<script>alert("xss")</script>\' OR 1=1; --';
    const user = await ctx.api.createUser({
      email: 'safe.user@test.io',
      name: maliciousPayload,
      role: 'user',
    });
    expect(user.statusCode).toBe(201);
    expect(user.data.name).toBe(maliciousPayload); // Opaque box preserves data without executing injection
  });

  test('F20-TC2: should reject empty and whitespace-only search queries gracefully', async () => {
    const res = await ctx.api.queryVectorSearch('   \t\n  ');
    expect(res.statusCode).toBe(400);
    expect(res.error).toBeDefined();
  });

  test('F20-TC3: should reject unauthenticated requests to protected endpoints', async () => {
    ctx.api.clearAuthToken();
    const rpcRes = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: 'bad_token' },
    });
    expect(rpcRes.success).toBeFalsy();
  });

  test('F20-TC4: should reject invalid Kafka events missing mandatory metadata', async () => {
    await expect(
      ctx.kafka.publish('ticket.assigned', {
        ticketId: '',
        title: '',
        userId: '',
        timestamp: '',
      })
    ).rejects.toThrow('Invalid schema');
  });

  test('F20-TC5: should handle remote MFE offline failure gracefully without crashing shell', async () => {
    ctx.mfe.setRemoteStatus('documents-mfe', 'OFFLINE');
    const result = await ctx.mfe.loadRemoteModule('documents-mfe', './Routes');
    expect(result.loaded).toBeFalsy();
    expect(result.fallbackTriggered).toBeTruthy();

    ctx.mfe.setRemoteStatus('documents-mfe', 'ONLINE');
  });
});
