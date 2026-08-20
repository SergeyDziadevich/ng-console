import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@ng-console-platform/ui': path.resolve(__dirname, './libs/shared/ui/src/index.ts'),
      '@ng-console/shared/models': path.resolve(__dirname, './libs/shared/models/src/index.ts'),
      '@ng-console/shared/data-access': path.resolve(__dirname, './libs/shared/data-access/src/index.ts'),
      '@ng-console/shared/ui': path.resolve(__dirname, './libs/shared/ui/src/index.ts'),
      '@ng-console/shared/layout': path.resolve(__dirname, './libs/shared/layout/src/index.ts'),
      '@ng-console/shared/util': path.resolve(__dirname, './libs/shared/util/src/index.ts'),
      '@env/environment': path.resolve(__dirname, './src/environments/environment.ts'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 64,
        functions: 61,
        branches: 62,
        statements: 61,
      },
    },
  },
});
