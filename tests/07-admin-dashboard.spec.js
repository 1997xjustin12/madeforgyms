import { test, expect } from '@playwright/test';
import { GYM_SLUG, ADMIN_PASSWORD, adminLogin } from './helpers.js';

// All tests in this file require admin credentials
test.beforeEach(async ({ page }, testInfo) => {
  if (!ADMIN_PASSWORD) {
    testInfo.skip();
    return;
  }
  await adminLogin(page);
});

test.describe('Admin Dashboard', () => {

  test('dashboard shows stat cards', async ({ page }) => {
    await expect(page.locator('text=/Total Members|Active|Expiring/i').first()).toBeVisible();
  });

  test('navbar shows all admin links', async ({ page }) => {
    await expect(page.locator(`a[href="/${GYM_SLUG}/admin/members"]`)).toBeVisible();
    await expect(page.locator(`a[href="/${GYM_SLUG}/admin/register"]`)).toBeVisible();
  });

  test('Members page loads and shows member list', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/members`);
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/admin/members`));
    // Either shows members or shows empty state
    await expect(
      page.locator('text=/members|No members/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Add Member form loads', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/register`);
    await expect(page.locator('input[placeholder*="Name"], input[placeholder*="name"]').first())
      .toBeVisible({ timeout: 8000 });
  });

  test('Attendance page loads and is scoped to gym', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/attendance`);
    await expect(page.locator('text=/Attendance|Daily/i')).toBeVisible({ timeout: 8000 });
    // Should show a date navigator
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test('Activity Logs page loads', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/logs`);
    await expect(page.locator('text=/Activity Logs|All admin/i')).toBeVisible({ timeout: 8000 });
    // Filter tabs should be visible
    await expect(page.locator('text=All')).toBeVisible();
  });

  test('Payments / Renewals page loads', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/renewals`);
    await expect(page.locator('text=/Renewal|Payment|Request/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('Coaches page loads', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/instructors`);
    await expect(page.locator('text=/Coach|Instructor/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('Settings page loads with gym name field', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/settings`);
    await expect(page.locator('input[placeholder*="gym"], input[id*="gym"], input[name*="gym"]').first())
      .toBeVisible({ timeout: 8000 });
  });

  test('logout redirects to gym portal not landing page', async ({ page }) => {
    // Find and click logout button
    const logoutBtn = page.locator('button[title="Logout"], button:has-text("Log Out")').first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    // Should land on /${GYM_SLUG}, NOT on /
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}$`));
  });

});
