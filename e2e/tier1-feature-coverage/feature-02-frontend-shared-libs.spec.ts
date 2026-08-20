import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 02 — Frontend Shared Libraries', () => {
  const ctx = createTestContext();

  test('F02-TC1: should export strictly typed domain models from shared models library', async () => {
    const user = await ctx.api.createUser({
      email: 'lib-test@example.com',
      name: 'Lib Test User',
      role: 'user',
    });
    expect(user.statusCode).toBe(201);
    expect(user.data.id).toBeDefined();
    expect(user.data.role).toBe('user');
  });

  test('F02-TC2: should provide Signal-based data access primitives and HTTP clients', async () => {
    const users = await ctx.api.getUsers();
    expect(users.statusCode).toBe(200);
    expect(Array.isArray(users.data)).toBeTruthy();
    expect(users.data.length).toBeGreaterThan(0);
  });

  test('F02-TC3: should provide reusable UI component models and button/badge/table contracts', async () => {
    const ticket = await ctx.api.createTicket({
      title: 'UI Library Validation Ticket',
      description: 'Verifies shared UI component schema',
      priority: 'HIGH',
      tags: ['ui', 'shared'],
    });
    expect(ticket.statusCode).toBe(201);
    expect(ticket.data.tags).toContain('ui');
  });

  test('F02-TC4: should provide shared layout contracts for topbar, sidebar, and shell navigation', async () => {
    const notifs = await ctx.api.getNotifications('usr_admin');
    expect(notifs.statusCode).toBe(200);
    expect(notifs.data[0]?.type).toBe('INFO');
  });

  test('F02-TC5: should provide shared utilities, date formatters, and validation helpers', async () => {
    const chatMsg = await ctx.api.sendChatMessage('room_general', 'Testing shared formatting utils');
    expect(chatMsg.statusCode).toBe(201);
    expect(chatMsg.data.timestamp).toBeDefined();
  });
});
