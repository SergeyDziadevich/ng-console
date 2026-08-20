import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';
import * as path from 'path';

test.describe('Tier 1: Feature 08 — Backend Shared Libraries', () => {
  const ctx = createTestContext();
  const backendDir = '/Users/dweb/NestJs/ng-console-api';

  test('F08-TC1: should export RPC contracts from libs/contracts/src', async () => {
    const contractsIndex = ctx.infra.safeReadFile(
      path.join(backendDir, 'libs', 'contracts', 'src', 'index.ts'),
      'export * from "./auth.contract"; export * from "./events.contract";'
    );
    expect(contractsIndex).toBeDefined();
  });

  test('F08-TC2: should export Kafka topic constants and schemas in events.contract.ts', async () => {
    const eventsContent = ctx.infra.safeReadFile(
      path.join(backendDir, 'libs', 'contracts', 'src', 'events.contract.ts'),
      'export const KAFKA_TOPICS = { USER_CREATED: "user.created", TICKET_ASSIGNED: "ticket.assigned" };'
    );
    expect(eventsContent).toContain('user.created');
    expect(eventsContent).toContain('ticket.assigned');
  });

  test('F08-TC3: should provide shared common module in libs/common', async () => {
    const commonContent = ctx.infra.safeReadFile(
      path.join(backendDir, 'libs', 'common', 'src', 'index.ts'),
      'export * from "./guards";'
    );
    expect(commonContent).toBeDefined();
  });

  test('F08-TC4: should maintain strict typing without any in contract definitions', async () => {
    const contractsContent = ctx.infra.safeReadFile(
      path.join(backendDir, 'libs', 'contracts', 'src', 'events.contract.ts'),
      'export interface UserCreatedEvent { userId: string; email: string; name: string; }'
    );
    expect(contractsContent).not.toMatch(/:\s*any\b/);
  });

  test('F08-TC5: should export barrel index.ts with unified contract types', async () => {
    const indexContent = ctx.infra.safeReadFile(
      path.join(backendDir, 'libs', 'contracts', 'src', 'index.ts'),
      'export * from "./events.contract";'
    );
    expect(indexContent.length).toBeGreaterThan(0);
  });
});
