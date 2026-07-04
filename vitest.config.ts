import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 66,
        functions: 63,
        branches: 64,
        statements: 63,
      },
    },
  },
});

