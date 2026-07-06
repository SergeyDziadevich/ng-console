import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 71,
        functions: 69,
        branches: 69,
        statements: 67,
      },
    },
  },
});

