import { test, expect } from '@playwright/test';

test.describe('Overview Page', () => {
  test('renders page title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Overview')).toBeVisible();
  });

  test('shows stat cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Plugins')).toBeVisible();
    await expect(page.getByText('MCP Servers')).toBeVisible();
  });
});
