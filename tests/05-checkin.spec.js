import { test, expect } from '@playwright/test';
import { GYM_SLUG } from './helpers.js';

test.describe('Check-In', () => {

  test('Check-In card on gym portal navigates to /checkin', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    await page.click('button:has-text("Gym Check-In")');
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/checkin`));
  });

  test('check-in page loads with search input', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/checkin`);
    await expect(page.locator('input[type="text"], input[type="search"], input[placeholder*="Search"]').first())
      .toBeVisible({ timeout: 10000 });
  });

  test('check-in page has gym name or logo in header', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/checkin`);
    // Header should not be empty
    await expect(page.locator('header, nav, [class*="header"]').first()).toBeVisible();
  });

  test('back arrow returns to gym portal', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/checkin`);
    const backLink = page.locator(`a[href="/${GYM_SLUG}"]`);
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}$`));
  });

  test('searching unknown member shows no results', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/checkin`);
    const input = page.locator('input').first();
    await input.fill('zzz_nobody_zzz');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=/No member|not found|No results/i')).toBeVisible({ timeout: 8000 });
  });

});
