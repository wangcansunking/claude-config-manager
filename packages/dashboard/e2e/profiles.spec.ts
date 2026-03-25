import { test, expect } from '@playwright/test';

test.describe('Profiles Page', () => {
  test('renders profiles page heading', async ({ page }) => {
    await page.goto('/profiles');
    await expect(page.getByText('Profiles')).toBeVisible();
  });

  test('shows profile list or empty state', async ({ page }) => {
    await page.goto('/profiles');
    // Either a list of profiles or an empty state message should be visible
    const hasProfiles = await page.getByRole('list').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText('No profiles').isVisible().catch(() => false);
    expect(hasProfiles || hasEmptyState).toBe(true);
  });
});
