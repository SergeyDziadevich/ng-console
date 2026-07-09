import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 67,
        functions: 64,
        branches: 67,
        statements: 62,
      },
    },
  },
});

