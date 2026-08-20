import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F08: Backend Shared Libraries', () => {
  const ctx = createTestContext();

  test('F08-B1: should reject RPC message pattern with empty string', async () => {
    const res = await ctx.rpc.send({ pattern: '', data: {} });
    expect(res.success).toBeFalsy();
  });

  test('F08-B2: should handle RPC payload containing nested objects and arrays', async () => {
    const complexData = {
      nested: { level1: { level2: { key: 'value' } } },
      items: [1, 2, 3, 4, 5],
    };
    const res = await ctx.rpc.send({
      pattern: 'tickets.create',
      data: { title: 'Complex Payload', description: JSON.stringify(complexData) },
    });
    expect(res.success).toBeTruthy();
  });

  test('F08-B3: should handle unknown Kafka topic publish attempt', async () => {
    const record = await ctx.kafka.publish('user.created', {
      userId: 'usr_1',
      email: 'test@example.com',
      name: 'Test',
      createdAt: new Date().toISOString(),
    });
    expect(record.topic).toBe('user.created');
  });

  test('F08-B4: should handle empty metadata record in audit log event', async () => {
    const record = await ctx.kafka.publish('audit-logs', {
      action: 'SYSTEM_BOOT',
      authorId: 'system',
      metadata: {},
      createdAt: new Date().toISOString(),
    });
    expect(record.value.metadata).toEqual({});
  });

  test('F08-B5: should handle special character in email field in user created event', async () => {
    const specialEmail = 'user+tag.sub-name_123@sub.domain.co.uk';
    const record = await ctx.kafka.publish('user.created', {
      userId: 'usr_spec',
      email: specialEmail,
      name: 'Special User',
      createdAt: new Date().toISOString(),
    });
    expect(record.value.email).toBe(specialEmail);
  });
});
