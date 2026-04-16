import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Genesis/);
});

test('vault setup flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h2')).toContainText('Create Master Password');
  await page.fill('input[type="password"]', 'test123456');
  await page.click('button[type="submit"]');
  await expect(page.locator('h2')).toContainText('Loading AI Model');
});
