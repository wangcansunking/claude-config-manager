import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/tui.e2e.test.ts'],
    testTimeout: 30000,
  },
});
