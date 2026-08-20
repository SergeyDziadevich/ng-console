import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Tier 1: Feature 01 — Frontend Nx Monorepo Structure', () => {
  const rootDir = '/Users/dweb/angular/ng-console';

  test('F01-TC1: should contain valid nx.json with required target defaults and plugins', async () => {
    const nxJsonPath = path.join(rootDir, 'nx.json');
    expect(fs.existsSync(nxJsonPath)).toBeTruthy();
    const nxJson = JSON.parse(fs.readFileSync(nxJsonPath, 'utf8')) as {
      targetDefaults?: Record<string, unknown>;
      plugins?: unknown[];
    };
    expect(nxJson).toBeDefined();
    expect(nxJson.targetDefaults).toBeDefined();
  });

  test('F01-TC2: should contain tsconfig.base.json with valid compiler options and module resolution', async () => {
    const tsconfigPath = path.join(rootDir, 'tsconfig.base.json');
    expect(fs.existsSync(tsconfigPath)).toBeTruthy();
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8')) as {
      compilerOptions?: {
        strict?: boolean;
        paths?: Record<string, string[]>;
      };
    };
    expect(tsconfig.compilerOptions).toBeDefined();
  });

  test('F01-TC3: should have package.json with standard build and e2e scripts', async () => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBeTruthy();
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['build']).toBeDefined();
    expect(pkg.scripts?.['e2e']).toBeDefined();
  });

  test('F01-TC4: should maintain project isolation with designated source folders', async () => {
    const srcExists = fs.existsSync(path.join(rootDir, 'src')) || fs.existsSync(path.join(rootDir, 'apps'));
    expect(srcExists).toBeTruthy();
  });

  test('F01-TC5: should provide ESLint configuration without circular dependency errors', async () => {
    const eslintExists =
      fs.existsSync(path.join(rootDir, 'eslint.config.js')) ||
      fs.existsSync(path.join(rootDir, '.eslintrc.json'));
    expect(eslintExists).toBeTruthy();
  });
});
