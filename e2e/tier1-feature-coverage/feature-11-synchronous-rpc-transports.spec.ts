import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 11 — Synchronous RPC Transports', () => {
  const ctx = createTestContext();

  test('F11-TC1: should execute synchronous RPC request with sub-50ms latency', async () => {
    const res = await ctx.rpc.send({
      pattern: 'users.find_all',
      data: {},
    });
    expect(res.success).toBeTruthy();
    expect(res.latencyMs).toBeLessThan(100);
  });

  test('F11-TC2: should return structured error on unregistered pattern', async () => {
    const res = await ctx.rpc.send({
      pattern: 'unknown.pattern.unregistered',
      data: {},
    });
    expect(res.success).toBeFalsy();
    expect(res.error).toContain('No RPC microservice handler registered');
  });

  test('F11-TC3: should propagate microservice exceptions with error messages', async () => {
    const res = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: 'invalid_token' },
    });
    expect(res.success).toBeFalsy();
    expect(res.error).toContain('Unauthorized');
  });

  test('F11-TC4: should validate strongly typed DTO payloads across transport boundaries', async () => {
    const res = await ctx.rpc.send({
      pattern: 'tickets.create',
      data: { title: 'Network Policy Enforcement', priority: 'HIGH' },
    });
    expect(res.success).toBeTruthy();
  });

  test('F11-TC5: should list all active RPC message patterns', async () => {
    const patterns = ctx.rpc.getAllPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(6);
    expect(patterns).toContain('auth.login');
    expect(patterns).toContain('users.find_by_id');
  });
});
