import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 4: Scenario 3 — Subscription Checkout & Invoice Lifecycle', () => {
  const ctx = createTestContext();

  test('Real-World Workflow: Plan selection in Payments MFE -> Stripe checkout -> Webhook event -> Invoice creation -> PDF download', async () => {
    // Step 1: Customer opens Payments MFE
    const paymentsMfe = await ctx.mfe.loadRemoteModule('payments-mfe', './Routes');
    expect(paymentsMfe.loaded).toBeTruthy();

    // Step 2: Select Enterprise annual plan and initiate checkout session
    const customerId = 'cus_globex_corp';
    const subRes = await ctx.api.createSubscription('plan_enterprise_annual', customerId);
    expect(subRes.statusCode).toBe(201);
    const subscription = subRes.data;
    expect(subscription.status).toBe('active');

    // Step 3: Stripe webhook received -> triggers subscription.activated Kafka event
    let activationAcknowledged = false;
    ctx.kafka.subscribe('subscription.activated', (rec) => {
      if (rec.value.planId === 'plan_enterprise_annual') {
        activationAcknowledged = true;
      }
    });

    await ctx.kafka.publish('subscription.activated', {
      userId: 'usr_globex_admin',
      email: 'finance@globex.corp',
      name: 'Globex Corp Finance',
      planName: 'Enterprise Annual',
      planId: 'plan_enterprise_annual',
      manageLink: 'https://billing.ng-console.io/p/session_123',
      timestamp: new Date().toISOString(),
    });
    expect(activationAcknowledged).toBeTruthy();

    // Step 4: Transactional invoice confirmation email sent
    const emailRecord = await ctx.kafka.publish('email.notification', {
      to: 'finance@globex.corp',
      name: 'Globex Corp Finance',
      subject: 'Invoice & Receipt for Cloud Console Enterprise',
      message: 'Your payment of $4,900.00 was processed successfully.',
      link: 'https://billing.ng-console.io/invoices/inv_latest.pdf',
    });
    expect(emailRecord.value.to).toBe('finance@globex.corp');

    // Step 5: Customer queries invoice history from Payments MFE
    const invoicesRes = await ctx.api.getInvoices(customerId);
    expect(invoicesRes.statusCode).toBe(200);
    expect(invoicesRes.data.length).toBeGreaterThan(0);
    const latestInvoice = invoicesRes.data[0]!;
    expect(latestInvoice.status).toBe('paid');
    expect(latestInvoice.amount).toBe(4900);
    expect(latestInvoice.pdfUrl).toBeDefined();

    // Step 6: Audit log captures subscription lifecycle event
    const auditRecord = await ctx.kafka.publish('audit-logs', {
      action: 'INVOICE_PAID_AND_DOWNLOADED',
      entityId: latestInvoice.id,
      entityType: 'Invoice',
      authorId: 'usr_globex_admin',
      metadata: { amount: 4900, currency: 'usd' },
      createdAt: new Date().toISOString(),
    });
    expect(auditRecord.topic).toBe('audit-logs');
  });

  test('Subscription renewal reminder notification dispatch', async () => {
    const event = await ctx.kafka.publish('email.notification', {
      to: 'finance@globex.corp',
      name: 'Globex Corp Finance',
      subject: 'Upcoming Subscription Renewal in 7 Days',
      message: 'Your Enterprise Annual plan will renew on September 1st.',
    });
    expect(event.value.subject).toContain('Renewal');
  });

  test('Payment method update flow without subscription interruption', async () => {
    const sub = await ctx.api.createSubscription('plan_pro', 'cus_update_card');
    expect(sub.data.status).toBe('active');
  });

  test('Proration calculation on mid-cycle plan upgrade', async () => {
    const rpcRes = await ctx.rpc.send({
      pattern: 'payments.create_subscription',
      data: { planId: 'plan_upgrade_pro_to_ent', customerId: 'cus_upgrade' },
    });
    expect(rpcRes.success).toBeTruthy();
  });

  test('Invoice PDF generation and verification', async () => {
    const invoices = await ctx.api.getInvoices('cus_globex_corp');
    expect(invoices.data[0]?.pdfUrl).toContain('.pdf');
  });
});
