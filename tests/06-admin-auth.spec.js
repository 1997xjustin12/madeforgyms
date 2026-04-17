import { test, expect } from '@playwright/test';
import { GYM_SLUG, ADMIN_EMAIL, ADMIN_PASSWORD, adminLogin } from './helpers.js';

test.describe('Admin Authentication', () => {

  test('Admin Portal card on gym portal navigates to /admin/login', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    await page.click('button:has-text("Admin Portal")');
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/admin/login`));
  });

  test('admin login page shows gym name', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/login`);
    await expect(page.locator('h1, [class*="font-black"]').first()).toBeVisible();
  });

  test('admin login page has email and password fields', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('wrong credentials shows error toast', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/login`);
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should show an error (toast or attempts warning)
    await expect(page.locator('text=/Incorrect|Invalid|attempt/i')).toBeVisible({ timeout: 8000 });
  });

  test('back link on admin login returns to gym portal', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/login`);
    await page.click('a:has-text("Back")');
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}$`));
  });

  test('password toggle shows and hides password', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/login`);
    const pwInput = page.locator('input[type="password"]');
    await pwInput.fill('testpassword');
    // Click the eye icon
    await page.locator('button[type="button"]').last().click();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    // Click again to hide
    await page.locator('button[type="button"]').last().click();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  // Only runs if TEST_ADMIN_PASSWORD is set
  test('correct credentials logs in and redirects to dashboard', async ({ page }) => {
    test.skip(!ADMIN_PASSWORD, 'Set TEST_ADMIN_PASSWORD env var to run this test');
    await adminLogin(page);
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/admin$`));
    await expect(page.locator('text=/Dashboard|Good morning|Good afternoon|Good evening/i')).toBeVisible();
  });

  test('unauthenticated access to /admin redirects to login', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin`);
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/admin/login`));
  });

});
