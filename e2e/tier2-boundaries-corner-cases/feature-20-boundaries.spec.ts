import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F20: Adversarial Coverage Hardening', () => {
  const ctx = createTestContext();

  test('F20-B1: should resist SQL injection attempts in ticket search', async () => {
    const sqlInjectionQuery = "'; DROP TABLE tickets; --";
    const res = await ctx.api.queryVectorSearch(sqlInjectionQuery);
    expect(res.statusCode).toBe(200);
    expect(res.data[0]?.snippet).toContain(sqlInjectionQuery);
  });

  test('F20-B2: should resist NoSQL injection payloads in user lookup', async () => {
    const noSqlPayload = '{"$gt": ""}';
    const rpcRes = await ctx.rpc.send({
      pattern: 'users.find_by_id',
      data: { id: noSqlPayload },
    });
    expect(rpcRes.success).toBeTruthy();
    expect((rpcRes.result as { id: string })?.id).toBe(noSqlPayload);
  });

  test('F20-B3: should resist cross-site scripting (XSS) in chat message payloads', async () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    const res = await ctx.api.sendChatMessage('room_general', xssPayload);
    expect(res.statusCode).toBe(201);
    expect(res.data.content).toBe(xssPayload);
  });

  test('F20-B4: should resist CRLF injection in HTTP headers', async () => {
    const crlfPayload = 'admin\r\nSet-Cookie: malicious=true';
    const res = await ctx.api.login(crlfPayload, 'password');
    expect(res.statusCode).toBe(200);
  });

  test('F20-B5: should handle unicode normalization overflows (Zalgo text)', async () => {
    const zalgoText = 'T̷̢͎̈́ḛ̶̾s̵̠̈́t̵̰̓ ̸̼̈́Ṳ̶̎s̷̰̈́ḛ̶̾r̵̼̈́';
    const res = await ctx.api.createUser({
      email: 'zalgo@test.io',
      name: zalgoText,
      role: 'user',
    });
    expect(res.statusCode).toBe(201);
    expect(res.data.name).toBe(zalgoText);
  });
});
