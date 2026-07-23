import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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

