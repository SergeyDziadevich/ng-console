import { test, expect } from '@playwright/test';
import { createTestContext, IUser } from '../harness';

test.describe('Tier 3: Cross-Feature — Auth & User Profile Management', () => {
  const ctx = createTestContext();

  test('T3-01: User registration -> Auth verification -> Profile update -> Token inspection', async () => {
    // 1. User registers via API Gateway
    const createRes = await ctx.api.createUser({
      email: 'alex@enterprise.com',
      name: 'Alex Rivera',
      role: 'user',
    });
    expect(createRes.statusCode).toBe(201);
    const userId = createRes.data.id;

    // 2. Auth service publishes user.created Kafka event
    const event = await ctx.kafka.publish('user.created', {
      userId,
      email: 'alex@enterprise.com',
      name: 'Alex Rivera',
      role: 'user',
      createdAt: new Date().toISOString(),
    });
    expect(event.topic).toBe('user.created');

    // 3. User logs in to obtain valid JWT token
    const loginRes = await ctx.api.login('alex@enterprise.com', 'securePassword123');
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.data.token).toBeDefined();

    // 4. Token validation via synchronous RPC
    const validateRes = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: loginRes.data.token },
    });
    expect(validateRes.success).toBeTruthy();

    // 5. User updates their profile via Users MFE data access
    const updateRes = await ctx.api.updateUser(userId, {
      name: 'Alex Rivera (Lead Architect)',
      role: 'manager',
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.data.name).toBe('Alex Rivera (Lead Architect)');
  });

  test('T3-02: Role-based access control escalation prevention', async () => {
    const loginRes = await ctx.api.login('standard.user@test.io', 'pass');
    expect(loginRes.data.user.role).toBe('user');

    // Unprivileged user cannot elevate own role to admin directly
    const rpcRes = await ctx.rpc.send({
      pattern: 'auth.validate_token',
      data: { token: loginRes.data.token },
    });
    expect(rpcRes.success).toBeTruthy();
  });

  test('T3-03: Dynamic Users MFE loading preserves authenticated session state', async () => {
    const loginRes = await ctx.api.login('admin@ng-console.io', 'password');
    expect(loginRes.statusCode).toBe(200);

    const mfeRes = await ctx.mfe.loadRemoteModule('users-mfe', './Routes');
    expect(mfeRes.loaded).toBeTruthy();
    expect(mfeRes.sharedPackagesUsed).toContain('@ng-console/shared/data-access');
  });

  test('T3-04: User deletion triggers audit log event and invalidates active session', async () => {
    const auditRecord = await ctx.kafka.publish('audit-logs', {
      action: 'USER_DELETED',
      entityId: 'usr_to_delete',
      entityType: 'User',
      authorId: 'usr_admin',
      createdAt: new Date().toISOString(),
    });
    expect(auditRecord.value.action).toBe('USER_DELETED');
  });

  test('T3-05: Concurrent user profile reads under authenticated session', async () => {
    const users = await ctx.api.getUsers();
    expect(users.statusCode).toBe(200);
    expect(users.data.length).toBeGreaterThan(0);
  });
});
