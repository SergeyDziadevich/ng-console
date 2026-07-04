import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 57,
        functions: 59,
        branches: 59,
        statements: 55,
      },
    },
  },
});

