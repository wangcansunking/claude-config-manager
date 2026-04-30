import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['src/__tests__/tui.e2e.test.ts', '**/node_modules/**'],
    testTimeout: 5000,
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
});
