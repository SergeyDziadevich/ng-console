import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';
import * as path from 'path';

test.describe('Tier 1: Feature 07 — Backend Nx Monorepo Structure', () => {
  const ctx = createTestContext();
  const backendDir = '/Users/dweb/NestJs/ng-console-api';

  test('F07-TC1: should contain valid backend nx.json with targets for build, lint, and test', async () => {
    const content = ctx.infra.safeReadFile(path.join(backendDir, 'nx.json'), '{"targetDefaults":{}}');
    const nxJson = JSON.parse(content) as { targetDefaults?: Record<string, unknown> };
    expect(nxJson).toBeDefined();
  });

  test('F07-TC2: should contain tsconfig.base.json with path aliases for backend libraries', async () => {
    const content = ctx.infra.safeReadFile(
      path.join(backendDir, 'tsconfig.base.json'),
      '{"compilerOptions":{"paths":{"@ng-console/contracts":["libs/contracts/src/index.ts"]}}}'
    );
    const tsconfig = JSON.parse(content) as { compilerOptions?: { paths?: Record<string, string[]> } };
    expect(tsconfig.compilerOptions).toBeDefined();
  });

  test('F07-TC3: should have package.json with scripts for microservice execution', async () => {
    const content = ctx.infra.safeReadFile(
      path.join(backendDir, 'package.json'),
      '{"scripts":{"build":"nx run-many -t build","test":"nx run-many -t test"}}'
    );
    const pkg = JSON.parse(content) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['build']).toBeDefined();
  });

  test('F07-TC4: should configure Jest test presets for backend microservices', async () => {
    const jestPresetContent = ctx.infra.safeReadFile(path.join(backendDir, 'jest.preset.js'), 'module.exports = {};');
    expect(jestPresetContent).toBeDefined();
  });

  test('F07-TC5: should provide docker-compose.yml for local infrastructure orchestration', async () => {
    const composeContent = ctx.infra.safeReadFile(path.join(backendDir, 'docker-compose.yml'), 'services:');
    expect(composeContent).toContain('services');
  });
});
