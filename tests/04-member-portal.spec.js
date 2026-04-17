import { test, expect } from '@playwright/test';
import { GYM_SLUG } from './helpers.js';

test.describe('Member Portal', () => {

  test('Member Portal card on gym portal navigates to /member', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    await page.click('button:has-text("Member Portal")');
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/member`));
  });

  test('member portal loads with phone lookup', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/member`);
    await expect(page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="number"]').first())
      .toBeVisible({ timeout: 10000 });
  });

  test('back arrow on member portal returns to gym portal', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/member`);
    await page.click('[aria-label="back"], a[href*="/${GYM_SLUG}"], button:has(svg)').catch(() => {});
    // Navigate using the ArrowLeft button
    const backBtn = page.locator('a').filter({ has: page.locator('svg') }).first();
    await backBtn.click();
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}$`));
  });

  test('searching with non-existent number shows not found', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/member`);
    const input = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="number"]').first();
    await input.fill('0000000000');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=/not found|No member/i')).toBeVisible({ timeout: 8000 });
  });

});
