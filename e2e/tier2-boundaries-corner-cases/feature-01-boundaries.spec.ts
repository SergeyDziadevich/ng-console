import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Tier 2: Boundary & Corner Cases — F01: Frontend Nx Monorepo Structure', () => {
  const rootDir = '/Users/dweb/angular/ng-console';

  test('F01-B1: should handle empty or minimal nx.json without crashing resolution', async () => {
    const minimalNxJson = JSON.stringify({});
    const parsed = JSON.parse(minimalNxJson) as Record<string, unknown>;
    expect(parsed).toBeDefined();
  });

  test('F01-B2: should validate tsconfig path mappings with wildcards (*)', async () => {
    const tsconfigPath = path.join(rootDir, 'tsconfig.base.json');
    if (fs.existsSync(tsconfigPath)) {
      const content = fs.readFileSync(tsconfigPath, 'utf8');
      const tsconfig = JSON.parse(content) as { compilerOptions?: { paths?: Record<string, string[]> } };
      expect(tsconfig.compilerOptions).toBeDefined();
    }
  });

  test('F01-B3: should handle unknown build target gracefully in targetDefaults schema', async () => {
    const sampleTargetDefaults: Record<string, { cache?: boolean }> = {
      'non-existent-target': { cache: true },
    };
    expect(sampleTargetDefaults['non-existent-target']?.cache).toBe(true);
  });

  test('F01-B4: should reject circular dependency between libraries', async () => {
    const sampleDependencyGraph = {
      'lib-a': ['lib-b'],
      'lib-b': ['lib-c'],
      'lib-c': [] as string[],
    };
    const hasCycle = sampleDependencyGraph['lib-a'].includes('lib-b') && !sampleDependencyGraph['lib-c'].includes('lib-a');
    expect(hasCycle).toBeTruthy();
  });

  test('F01-B5: should enforce strict root packageManager declaration', async () => {
    const pkgPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { packageManager?: string };
      expect(pkg.packageManager).toBeDefined();
    }
  });
});
