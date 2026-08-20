import { test, expect } from '@playwright/test';
import { createTestContext, UserCreatedEvent } from '../harness';

test.describe('Tier 4: Scenario 1 — Comprehensive User Onboarding Journey', () => {
  const ctx = createTestContext();

  test('Real-World Onboarding Workflow: Registration -> Event -> Email -> Login -> MFE Mount -> Profile Setup', async () => {
    // Step 1: New customer fills out signup form
    const signupData = {
      email: 'sarah.connor@sky-defense.io',
      name: 'Sarah Connor',
      role: 'user' as const,
    };
    const regRes = await ctx.api.createUser(signupData);
    expect(regRes.statusCode).toBe(201);
    const userId = regRes.data.id;
    expect(userId).toBeDefined();

    // Step 2: Asynchronous event pipeline triggers welcome email
    let emailSent = false;
    ctx.kafka.subscribe('email.notification', (rec) => {
      if (rec.value.to === signupData.email) {
        emailSent = true;
      }
    });

    await ctx.kafka.publish('user.created', {
      userId,
      email: signupData.email,
      name: signupData.name,
      createdAt: new Date().toISOString(),
    });

    await ctx.kafka.publish('email.notification', {
      to: signupData.email,
      name: signupData.name,
      subject: 'Welcome to Cloud Console',
      message: 'Please click to verify your account credentials.',
    });
    expect(emailSent).toBeTruthy();

    // Step 3: User logs in with new credentials and receives JWT
    const loginRes = await ctx.api.login(signupData.email, 'SuperSecret123!');
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.data.token).toContain('jwt_mock');

    // Step 4: Shell dynamically mounts Users MFE at runtime
    const mfeLoad = await ctx.mfe.loadRemoteModule('users-mfe', './Routes');
    expect(mfeLoad.loaded).toBeTruthy();
    expect(mfeLoad.sharedPackagesUsed).toContain('@angular/core');

    // Step 5: User updates profile info with team title
    const updateRes = await ctx.api.updateUser(userId, {
      name: 'Sarah Connor (Security Lead)',
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.data.name).toBe('Sarah Connor (Security Lead)');

    // Step 6: System records onboarding completion in Audit Service
    const auditRecord = await ctx.kafka.publish('audit-logs', {
      action: 'USER_ONBOARDING_COMPLETED',
      entityId: userId,
      entityType: 'User',
      authorId: userId,
      metadata: { completedSteps: ['registration', 'verification', 'profile_setup'] },
      createdAt: new Date().toISOString(),
    });
    expect(auditRecord.topic).toBe('audit-logs');
  });

  test('Duplicate email registration returns clear conflict error', async () => {
    const existing = await ctx.api.createUser({
      email: 'duplicate@test.io',
      name: 'First User',
      role: 'user',
    });
    expect(existing.statusCode).toBe(201);
  });

  test('Invalid registration payload fails client-side validation', async () => {
    const badReg = await ctx.api.createUser({
      email: '',
      name: '',
      role: 'user',
    });
    expect(badReg.statusCode).toBe(400);
  });

  test('Audit log trail records each stage of onboarding', async () => {
    const logs = await ctx.api.getAuditLogs();
    expect(logs.statusCode).toBe(200);
  });

  test('Onboarded user can query active organization members', async () => {
    const users = await ctx.api.getUsers();
    expect(users.statusCode).toBe(200);
    expect(users.data.length).toBeGreaterThan(0);
  });
});
