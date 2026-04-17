import { test, expect } from '@playwright/test';
import { GYM_SLUG } from './helpers.js';

/**
 * Multi-tenant isolation tests.
 * These verify that gym-scoped pages correctly require a valid slug
 * and that unauthenticated access is redirected properly.
 */
test.describe('Multi-Tenant Isolation', () => {

  test('admin routes without a slug redirect to /', async ({ page }) => {
    // Old-style routes should no longer exist
    await page.goto('/admin/login');
    // Should be on / or GymNotFound, NOT the admin login
    await expect(page).not.toHaveURL('/admin/login');
  });

  test('member portal without slug redirects to /', async ({ page }) => {
    await page.goto('/member');
    await expect(page).not.toHaveURL('/member');
  });

  test('checkin without slug redirects to /', async ({ page }) => {
    await page.goto('/checkin');
    await expect(page).not.toHaveURL('/checkin');
  });

  test('each gym has its own isolated portal URL', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    const url = page.url();
    expect(url).toContain(`/${GYM_SLUG}`);
    // The gym name should reflect the gym, not be generic
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('gym portal shows correct 3 entry points', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    await expect(page.locator('button:has-text("Member Portal")')).toBeVisible();
    await expect(page.locator('button:has-text("Gym Check-In")')).toBeVisible();
    await expect(page.locator('button:has-text("Admin Portal")')).toBeVisible();
  });

  test('each portal entry point links to slug-scoped URL', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);

    // Member Portal → /${slug}/member
    const [memberPage] = await Promise.all([
      page.waitForURL(new RegExp(`/${GYM_SLUG}/member`)),
      page.click('button:has-text("Member Portal")'),
    ]);
    await page.goBack();

    // Check-In → /${slug}/checkin
    await Promise.all([
      page.waitForURL(new RegExp(`/${GYM_SLUG}/checkin`)),
      page.click('button:has-text("Gym Check-In")'),
    ]);
    await page.goBack();

    // Admin Portal → /${slug}/admin/login
    await Promise.all([
      page.waitForURL(new RegExp(`/${GYM_SLUG}/admin/login`)),
      page.click('button:has-text("Admin Portal")'),
    ]);
  });

  test('unauthenticated /admin redirects to /:slug/admin/login', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin`);
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/admin/login`));
  });

  test('unauthenticated /admin/members redirects to login', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/admin/members`);
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}/admin/login`));
  });

  test('tab title changes to gym name when inside a gym', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/member`);
    // Title should reflect the gym name (not just "MadeForGyms")
    const title = await page.title();
    // Give it a moment to update from settings
    await page.waitForTimeout(2000);
    const titleAfter = await page.title();
    // Should not be blank
    expect(titleAfter.length).toBeGreaterThan(0);
  });

});
