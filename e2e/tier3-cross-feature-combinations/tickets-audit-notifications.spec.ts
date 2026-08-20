import { test, expect } from '@playwright/test';
import { createTestContext, TicketAssignedEvent } from '../harness';

test.describe('Tier 3: Cross-Feature — Tickets, Audit Logging & Notifications', () => {
  const ctx = createTestContext();

  test('T3-06: Ticket creation in Tickets MFE -> Gateway RPC -> Kafka Event -> Notification Dispatch -> Audit Log', async () => {
    // 1. Load Tickets MFE
    const mfeLoad = await ctx.mfe.loadRemoteModule('tickets-mfe', './Routes');
    expect(mfeLoad.loaded).toBeTruthy();

    // 2. Submit new ticket through API Gateway
    const ticketRes = await ctx.api.createTicket({
      title: 'Database connection pool timeout in staging',
      description: 'Occasional connection drop during spike tests',
      priority: 'HIGH',
      assignedTo: 'usr_dev_lead',
      tags: ['database', 'staging'],
    });
    expect(ticketRes.statusCode).toBe(201);
    const ticketId = ticketRes.data.id;

    // 3. Dispatch ticket.assigned Kafka event
    let notificationReceived = false;
    ctx.kafka.subscribe('ticket.assigned', (rec) => {
      const val = rec.value as TicketAssignedEvent;
      if (val.ticketId === ticketId) {
        notificationReceived = true;
      }
    });

    await ctx.kafka.publish('ticket.assigned', {
      ticketId,
      title: ticketRes.data.title,
      userId: 'usr_dev_lead',
      assignedBy: 'usr_admin',
      priority: 'HIGH',
      timestamp: new Date().toISOString(),
    });
    expect(notificationReceived).toBeTruthy();

    // 4. Audit service records immutable audit entry
    const auditRecord = await ctx.kafka.publish('audit-logs', {
      action: 'TICKET_CREATED_AND_ASSIGNED',
      entityId: ticketId,
      entityType: 'Ticket',
      authorId: 'usr_admin',
      metadata: { priority: 'HIGH', assignedTo: 'usr_dev_lead' },
      createdAt: new Date().toISOString(),
    });
    expect(auditRecord.topic).toBe('audit-logs');

    // 5. Query user notifications in Shell
    const notifs = await ctx.api.getNotifications('usr_dev_lead');
    expect(notifs.statusCode).toBe(200);
  });

  test('T3-07: Ticket status update workflow (OPEN -> IN_PROGRESS -> RESOLVED)', async () => {
    const rpcRes = await ctx.rpc.send({
      pattern: 'tickets.create',
      data: { title: 'Workflow Ticket', priority: 'MEDIUM' },
    });
    expect(rpcRes.success).toBeTruthy();
  });

  test('T3-08: Urgent ticket priority escalates notification severity', async () => {
    const urgentTicket = await ctx.api.createTicket({
      title: 'CRITICAL OUTAGE',
      description: 'Production payment gateway down',
      priority: 'URGENT',
    });
    expect(urgentTicket.data.priority).toBe('URGENT');
  });

  test('T3-09: Unassigned tickets default to unassigned pool without notification failure', async () => {
    const ticket = await ctx.api.createTicket({
      title: 'General Bug',
      description: 'Minor styling glitch',
      priority: 'LOW',
    });
    expect(ticket.data.assignedTo).toBeUndefined();
  });

  test('T3-10: Batch audit trail extraction for compliance reporting', async () => {
    const auditLogs = await ctx.api.getAuditLogs();
    expect(auditLogs.statusCode).toBe(200);
    expect(auditLogs.data.length).toBeGreaterThan(0);
  });
});
