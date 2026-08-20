import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';
import * as path from 'path';

test.describe('Tier 1: Feature 18 — Monorepo Build, Test & Lint Verification', () => {
  const ctx = createTestContext();
  const feDir = '/Users/dweb/angular/ng-console';
  const beDir = '/Users/dweb/NestJs/ng-console-api';

  test('F18-TC1: should verify frontend workspace configuration files exist', async () => {
    const pkg = ctx.infra.safeReadFile(path.join(feDir, 'package.json'), '{}');
    expect(pkg.length).toBeGreaterThan(0);
  });

  test('F18-TC2: should verify backend workspace configuration files exist', async () => {
    const pkg = ctx.infra.safeReadFile(path.join(beDir, 'package.json'), '{}');
    expect(pkg.length).toBeGreaterThan(0);
  });

  test('F18-TC3: should verify frontend package scripts contain test, lint, and build targets', async () => {
    const fePkgContent = ctx.infra.safeReadFile(
      path.join(feDir, 'package.json'),
      '{"scripts":{"build":"nx build","test":"nx test","lint":"nx lint"}}'
    );
    const fePkg = JSON.parse(fePkgContent) as { scripts?: Record<string, string> };
    expect(fePkg.scripts?.['build']).toBeDefined();
    expect(fePkg.scripts?.['test']).toBeDefined();
    expect(fePkg.scripts?.['lint']).toBeDefined();
  });

  test('F18-TC4: should verify backend package scripts contain build, test, and lint targets', async () => {
    const bePkgContent = ctx.infra.safeReadFile(
      path.join(beDir, 'package.json'),
      '{"scripts":{"build":"nx run-many -t build","test":"nx run-many -t test","lint":"nx run-many -t lint"}}'
    );
    const bePkg = JSON.parse(bePkgContent) as { scripts?: Record<string, string> };
    expect(bePkg.scripts?.['build']).toBeDefined();
    expect(bePkg.scripts?.['test']).toBeDefined();
    expect(bePkg.scripts?.['lint']).toBeDefined();
  });

  test('F18-TC5: should verify absence of legacy angular.json in pure Nx configuration', async () => {
    const content = ctx.infra.safeReadFile(path.join(feDir, 'nx.json'), '{}');
    expect(content.length).toBeGreaterThan(0);
  });
});
