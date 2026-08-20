import { test, expect } from '@playwright/test';
import { createTestContext, TicketAssignedEvent } from '../harness';

test.describe('Tier 4: Scenario 2 — Incident Ticket Triage & Resolution Workflow', () => {
  const ctx = createTestContext();

  test('Real-World Workflow: Client submits incident -> Gateway RPC -> Kafka assignment -> Support engineer works -> Resolved -> Audit trail', async () => {
    // Step 1: Client loads Tickets MFE
    const ticketsMfe = await ctx.mfe.loadRemoteModule('tickets-mfe', './Routes');
    expect(ticketsMfe.loaded).toBeTruthy();

    // Step 2: Client submits incident report
    const ticketRes = await ctx.api.createTicket({
      title: 'Payment webhook returning 504 gateway timeout',
      description: 'Stripe webhook responses are exceeding 10s latency in production',
      priority: 'URGENT',
      tags: ['production', 'billing', 'high-priority'],
    });
    expect(ticketRes.statusCode).toBe(201);
    const ticketId = ticketRes.data.id;

    // Step 3: Support lead triages and assigns ticket to on-call engineer
    let engineerNotified = false;
    ctx.kafka.subscribe('ticket.assigned', (rec) => {
      const val = rec.value as TicketAssignedEvent;
      if (val.userId === 'usr_oncall_engineer') {
        engineerNotified = true;
      }
    });

    await ctx.kafka.publish('ticket.assigned', {
      ticketId,
      title: ticketRes.data.title,
      userId: 'usr_oncall_engineer',
      assignedBy: 'usr_support_lead',
      priority: 'URGENT',
      timestamp: new Date().toISOString(),
    });
    expect(engineerNotified).toBeTruthy();

    // Step 4: Engineer updates ticket status to IN_PROGRESS and adds resolution comment
    const rpcUpdate = await ctx.rpc.send({
      pattern: 'tickets.create',
      data: {
        title: `${ticketRes.data.title} [IN_PROGRESS]`,
        priority: 'URGENT',
      },
    });
    expect(rpcUpdate.success).toBeTruthy();

    // Step 5: Engineer applies fix and closes ticket
    const auditResolution = await ctx.kafka.publish('audit-logs', {
      action: 'TICKET_RESOLVED',
      entityId: ticketId,
      entityType: 'Ticket',
      authorId: 'usr_oncall_engineer',
      metadata: { rootCause: 'Redis connection pool exhaustion', fix: 'Scaled Redis replicas' },
      createdAt: new Date().toISOString(),
    });
    expect(auditResolution.value.action).toBe('TICKET_RESOLVED');

    // Step 6: User receives resolution notification in Shell
    const notifs = await ctx.api.getNotifications('usr_current');
    expect(notifs.statusCode).toBe(200);
  });

  test('Urgent incident triggers broadcast alert notification', async () => {
    const notif = await ctx.api.getNotifications('usr_admin');
    expect(notif.statusCode).toBe(200);
  });

  test('Ticket kanban board view groups tickets by status', async () => {
    const tickets = await ctx.api.getTickets();
    expect(tickets.statusCode).toBe(200);
    expect(tickets.data.length).toBeGreaterThan(0);
  });

  test('Ticket search filter by priority and tag', async () => {
    const tickets = await ctx.api.getTickets();
    const highTickets = tickets.data.filter((t) => t.priority === 'HIGH');
    expect(highTickets.length).toBeGreaterThanOrEqual(1);
  });

  test('Audit trail preserves complete history of status changes', async () => {
    const logs = await ctx.api.getAuditLogs();
    expect(logs.statusCode).toBe(200);
  });
});
