import { test, expect } from '@playwright/test';

test.describe('Plugins Page', () => {
  test('renders plugins page heading', async ({ page }) => {
    await page.goto('/plugins');
    await expect(page.getByText('Plugins')).toBeVisible();
  });

  test('shows plugin list or empty state', async ({ page }) => {
    await page.goto('/plugins');
    // Either a list of plugins or an empty state message should be visible
    const hasPlugins = await page.getByRole('list').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText('No plugins').isVisible().catch(() => false);
    expect(hasPlugins || hasEmptyState).toBe(true);
  });
});
