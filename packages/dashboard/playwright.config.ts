import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3399',
    colorScheme: 'dark',
  },
  webServer: {
    command: 'npm run dev',
    port: 3399,
    reuseExistingServer: true,
  },
});
