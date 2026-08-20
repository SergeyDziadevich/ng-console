import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F12: Asynchronous Kafka Event Streaming', () => {
  const ctx = createTestContext();

  test('F12-B1: should reject document.signed event without documentId', async () => {
    await expect(
      ctx.kafka.publish('document.signed', {
        documentId: '',
        signerEmail: 'signer@test.io',
        title: 'NDA',
        signedAt: new Date().toISOString(),
      })
    ).rejects.toThrow('missing documentId');
  });

  test('F12-B2: should reject email.notification event without recipient to address', async () => {
    await expect(
      ctx.kafka.publish('email.notification', {
        to: '',
        name: 'Recipient',
        message: 'Hello',
      })
    ).rejects.toThrow('missing to');
  });

  test('F12-B3: should handle multi-subscriber fan-out on single published event', async () => {
    let sub1Called = false;
    let sub2Called = false;

    const un1 = ctx.kafka.subscribe('audit-logs', () => {
      sub1Called = true;
    });
    const un2 = ctx.kafka.subscribe('audit-logs', () => {
      sub2Called = true;
    });

    await ctx.kafka.publish('audit-logs', {
      action: 'FANOUT_TEST',
      authorId: 'usr_admin',
      createdAt: new Date().toISOString(),
    });

    expect(sub1Called).toBeTruthy();
    expect(sub2Called).toBeTruthy();

    un1();
    un2();
  });

  test('F12-B4: should maintain monotonically increasing offsets per topic', async () => {
    const r1 = await ctx.kafka.publish('user.created', {
      userId: 'u1',
      email: 'u1@test.com',
      name: 'User 1',
      createdAt: new Date().toISOString(),
    });
    const r2 = await ctx.kafka.publish('user.created', {
      userId: 'u2',
      email: 'u2@test.com',
      name: 'User 2',
      createdAt: new Date().toISOString(),
    });
    expect(r2.offset).toBeGreaterThan(r1.offset);
  });

  test('F12-B5: should preserve message headers in Kafka records', async () => {
    const record = await ctx.kafka.publish(
      'user.created',
      {
        userId: 'u_hdr',
        email: 'hdr@test.com',
        name: 'Header User',
        createdAt: new Date().toISOString(),
      },
      'u_hdr_key',
      { 'x-correlation-id': 'corr-12345' }
    );
    expect(record.headers?.['x-correlation-id']).toBe('corr-12345');
  });
});
