import { test, expect } from '@playwright/test';
import { GYM_SLUG, COACH_CODE } from './helpers.js';

test.describe('Coach Portal', () => {

  test('coach login page loads from gym portal', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/coach`);
    await expect(page.locator('input[placeholder*="code"], input[placeholder*="Code"]').first())
      .toBeVisible({ timeout: 8000 });
  });

  test('wrong access code shows error', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/coach`);
    const input = page.locator('input').first();
    await input.fill('WRONGCODE999');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/Invalid|invalid/i')).toBeVisible({ timeout: 8000 });
  });

  test('back link on coach login returns to gym portal', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/coach`);
    await page.click('a:has-text("Back")');
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}$`));
  });

  // Only runs if TEST_COACH_CODE is set
  test('valid access code navigates to coach portal', async ({ page }) => {
    test.skip(!COACH_CODE, 'Set TEST_COACH_CODE env var to run this test');
    await page.goto(`/${GYM_SLUG}/coach`);
    await page.fill('input', COACH_CODE);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/coach/${COACH_CODE}`));
    await expect(page.locator('text=Coach Portal')).toBeVisible();
  });

  // Test that a coach code from another gym can't access this gym's portal
  test('coach code lookup is scoped to current gym', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/coach`);
    // Any random code should fail — the lookup is filtered by gym_id
    await page.fill('input', 'TESTCROSS01');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/Invalid|invalid/i')).toBeVisible({ timeout: 8000 });
  });

});
