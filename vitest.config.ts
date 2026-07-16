import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 64,
        functions: 62,
        branches: 63,
        statements: 62,
      },
    },
  },
});

