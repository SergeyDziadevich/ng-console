import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@ng-console-platform/ui': path.resolve(__dirname, './libs/ui/src/index.ts'),
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
