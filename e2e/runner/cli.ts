/// <reference types="node" />
/**
 * CLI Entrypoint for Unified E2E Test Suite Runner
 * Usage:
 *   npx ts-node e2e/runner/cli.ts
 *   npx ts-node e2e/runner/cli.ts --tier 1
 *   npx ts-node e2e/runner/cli.ts --feature F03
 */

import { UnifiedTestRunner } from './runner';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let tier: 1 | 2 | 3 | 4 | undefined;
  let featureId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier' && args[i + 1]) {
      const parsedTier = parseInt(args[i + 1]!, 10);
      if (parsedTier >= 1 && parsedTier <= 4) {
        tier = parsedTier as 1 | 2 | 3 | 4;
      }
      i++;
    } else if (args[i] === '--feature' && args[i + 1]) {
      featureId = args[i + 1]!.toUpperCase();
      i++;
    }
  }

  const runner = new UnifiedTestRunner();
  const summary = await runner.run({ tier, featureId });

  if (summary.failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

void main();
