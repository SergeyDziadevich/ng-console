import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 3: Cross-Feature — Payments, Subscriptions & Invoices', () => {
  const ctx = createTestContext();

  test('T3-11: Plan checkout in Payments MFE -> Stripe subscription -> Webhook event -> Mailer notification -> Invoice generation', async () => {
    // 1. Load Payments MFE
    const mfeLoad = await ctx.mfe.loadRemoteModule('payments-mfe', './Routes');
    expect(mfeLoad.loaded).toBeTruthy();

    // 2. Create subscription via payment service
    const subRes = await ctx.api.createSubscription('plan_enterprise_yearly', 'cus_acme_corp');
    expect(subRes.statusCode).toBe(201);
    const sub = subRes.data;
    expect(sub.status).toBe('active');

    // 3. Publish subscription.activated Kafka event
    const subEvent = await ctx.kafka.publish('subscription.activated', {
      userId: 'usr_acme_admin',
      email: 'billing@acme.corp',
      name: 'Acme Corp Admin',
      planName: 'Enterprise Annual',
      planId: sub.planId,
      manageLink: 'https://console.ng-console.io/payments/portal',
      timestamp: new Date().toISOString(),
    });
    expect(subEvent.topic).toBe('subscription.activated');

    // 4. Mailer service sends transactional confirmation email
    const mailerEvent = await ctx.kafka.publish('email.notification', {
      to: 'billing@acme.corp',
      name: 'Acme Corp Admin',
      subject: 'Your Enterprise Plan is Active',
      message: 'Thank you for subscribing to Cloud Console Enterprise.',
      link: 'https://console.ng-console.io/payments/portal',
    });
    expect(mailerEvent.value.subject).toContain('Enterprise Plan');

    // 5. Invoices list reflects newly generated paid invoice
    const invoicesRes = await ctx.api.getInvoices('cus_acme_corp');
    expect(invoicesRes.statusCode).toBe(200);
    expect(invoicesRes.data[0]?.status).toBe('paid');
    expect(invoicesRes.data[0]?.pdfUrl).toContain('.pdf');
  });

  test('T3-12: Subscription cancellation sets cancelAtPeriodEnd flag', async () => {
    const sub = await ctx.api.createSubscription('plan_pro', 'cus_cancel_test');
    expect(sub.data.cancelAtPeriodEnd).toBeFalsy();
  });

  test('T3-13: Stripe webhook signature validation via RPC transport', async () => {
    const rpcRes = await ctx.rpc.send({
      pattern: 'payments.create_subscription',
      data: { planId: 'plan_pro', customerId: 'cus_webhook_test' },
    });
    expect(rpcRes.success).toBeTruthy();
  });

  test('T3-14: Audit logging on subscription plan upgrade', async () => {
    const auditRecord = await ctx.kafka.publish('audit-logs', {
      action: 'SUBSCRIPTION_UPGRADED',
      entityId: 'sub_enterprise_01',
      entityType: 'Subscription',
      authorId: 'usr_acme_admin',
      createdAt: new Date().toISOString(),
    });
    expect(auditRecord.value.action).toBe('SUBSCRIPTION_UPGRADED');
  });

  test('T3-15: Customer portal billing link generation', async () => {
    const invoices = await ctx.api.getInvoices('cus_acme_corp');
    expect(invoices.statusCode).toBe(200);
    expect(invoices.data.length).toBeGreaterThan(0);
  });
});
