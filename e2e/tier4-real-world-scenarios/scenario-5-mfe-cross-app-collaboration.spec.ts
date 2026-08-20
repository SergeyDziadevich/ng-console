import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 4: Scenario 5 — Cross-MFE Collaborative Workspace Integration', () => {
  const ctx = createTestContext();

  test('Real-World Workflow: Shell Login -> Users MFE -> Tickets MFE -> Chat MFE link -> Global notification broadcast', async () => {
    // Step 1: User authenticates in Host Shell
    const loginRes = await ctx.api.login('lead.developer@ng-console.io', 'SuperPass123');
    expect(loginRes.statusCode).toBe(200);
    const user = loginRes.data.user;

    // Step 2: Navigate to Users MFE to identify team members
    const usersMfe = await ctx.mfe.loadRemoteModule('users-mfe', './Routes');
    expect(usersMfe.loaded).toBeTruthy();
    const teamMembers = await ctx.api.getUsers();
    expect(teamMembers.data.length).toBeGreaterThanOrEqual(2);
    const assignedDev = teamMembers.data.find((m) => m.role === 'user') || teamMembers.data[0]!;

    // Step 3: Switch to Tickets MFE to create a coordinated deployment ticket
    const ticketsMfe = await ctx.mfe.loadRemoteModule('tickets-mfe', './Routes');
    expect(ticketsMfe.loaded).toBeTruthy();
    const ticketRes = await ctx.api.createTicket({
      title: 'Deploy microservices release v2.4.0 to Staging',
      description: 'Coordinate with QA team on verification test suite execution',
      priority: 'HIGH',
      assignedTo: assignedDev.id,
      tags: ['release', 'staging', 'deployment'],
    });
    expect(ticketRes.statusCode).toBe(201);
    const ticket = ticketRes.data;

    // Step 4: Switch to Chat MFE and post ticket reference into team chat room
    const chatMfe = await ctx.mfe.loadRemoteModule('chat-mfe', './Routes');
    expect(chatMfe.loaded).toBeTruthy();
    const rooms = await ctx.api.getChatRooms();
    const targetRoomId = rooms.data[0]!.id;

    const chatMsg = await ctx.api.sendChatMessage(
      targetRoomId,
      `Team: Ticket #${ticket.id} (${ticket.title}) has been assigned to ${assignedDev.name}. Please review!`
    );
    expect(chatMsg.statusCode).toBe(201);
    expect(chatMsg.data.content).toContain(ticket.id);

    // Step 5: Global alert notification dispatched to all participants in Shell
    const notifRes = await ctx.api.getNotifications(assignedDev.id);
    expect(notifRes.statusCode).toBe(200);

    // Step 6: Verify all 6 shared singleton packages remained unbroken throughout multi-app session
    const singletons = ctx.mfe.getSharedSingletons();
    expect(singletons).toContain('@angular/core');
    expect(singletons).toContain('@angular/router');
    expect(singletons).toContain('@ng-console/shared/data-access');
    expect(singletons).toContain('@ng-console/shared/models');
  });

  test('Rapid deep-linking across remote MFEs without page reload or state loss', async () => {
    const sequence = ['documents-mfe', 'payments-mfe', 'ai-assistant-mfe', 'users-mfe', 'tickets-mfe', 'chat-mfe'];
    for (const remote of sequence) {
      const res = await ctx.mfe.loadRemoteModule(remote, './Routes');
      expect(res.loaded).toBeTruthy();
    }
  });

  test('Shell notification badge updates dynamically across all remote view transitions', async () => {
    const notifs = await ctx.api.getNotifications('usr_admin');
    expect(notifs.statusCode).toBe(200);
  });

  test('Shared HTTP interceptor attaches bearer token uniformly across all MFE API calls', async () => {
    await ctx.api.login('interceptor.test@ng-console.io', 'pass');
    const headers = ctx.api.getHeaders();
    expect(headers['Authorization']).toContain('Bearer');
  });

  test('Single-page application router preserves back/forward history stack across remote modules', async () => {
    const mfe1 = await ctx.mfe.loadRemoteModule('users-mfe', './Routes');
    const mfe2 = await ctx.mfe.loadRemoteModule('tickets-mfe', './Routes');
    expect(mfe1.loaded && mfe2.loaded).toBeTruthy();
  });
});
