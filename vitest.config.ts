import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 47,
        functions: 45,
        branches: 44,
        statements: 44,
      },
    },
  },
});

