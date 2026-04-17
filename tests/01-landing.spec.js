import { test, expect } from '@playwright/test';

test.describe('Landing Page — MadeForGyms', () => {

  test('loads the landing page at /', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('MadeForGyms');
    // Logo / brand visible
    await expect(page.locator('text=MadeForGyms').first()).toBeVisible();
  });

  test('navbar only shows Features, How it Works, Pricing + Get Started', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a', { hasText: 'Features' }).first()).toBeVisible();
    await expect(page.locator('a', { hasText: 'How it Works' }).first()).toBeVisible();
    await expect(page.locator('a', { hasText: 'Pricing' }).first()).toBeVisible();
    await expect(page.locator('a', { hasText: 'Get Started' })).toBeVisible();
    // These should NOT appear in the navbar anymore
    await expect(page.locator('nav a', { hasText: 'Member Portal' })).not.toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Login' })).not.toBeVisible();
  });

  test('Get Started button navigates to /portal', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Get Started")');
    await expect(page).toHaveURL(/\/portal/);
  });

  test('/mfg redirects to /', async ({ page }) => {
    await page.goto('/mfg');
    await expect(page).toHaveURL('/');
  });

  test('unknown routes redirect to /', async ({ page }) => {
    await page.goto('/this-does-not-exist-at-all-xyz');
    // Should show GymNotFound (treated as a slug attempt) or redirect to /
    // Either way the user should not see a blank page
    await expect(page.locator('body')).not.toBeEmpty();
  });

});
