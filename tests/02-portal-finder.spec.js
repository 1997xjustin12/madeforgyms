import { test, expect } from '@playwright/test';
import { GYM_SLUG } from './helpers.js';

test.describe('Portal Finder — /portal', () => {

  test('shows the gym URL input', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.locator('text=Find your gym')).toBeVisible();
    await expect(page.locator('input[placeholder*="yourgymname"]')).toBeVisible();
    await expect(page.locator('text=madeforgyms.com/')).toBeVisible();
  });

  test('submitting a valid slug navigates to the gym portal', async ({ page }) => {
    await page.goto('/portal');
    await page.fill('input[placeholder*="yourgymname"]', GYM_SLUG);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}$`));
  });

  test('shows error if submitted empty', async ({ page }) => {
    await page.goto('/portal');
    // Button should be disabled when empty
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Back to MadeForGyms link goes to /', async ({ page }) => {
    await page.goto('/portal');
    await page.click('a:has-text("Back to MadeForGyms")');
    await expect(page).toHaveURL('/');
  });

});
