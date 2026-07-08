import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 69,
        functions: 65,
        branches: 67,
        statements: 64,
      },
    },
  },
});

