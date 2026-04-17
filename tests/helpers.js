// Shared test helpers and constants
export const GYM_SLUG = 'powerfitnessgym';
export const BASE     = 'http://localhost:5173';

// Admin credentials — set in your .env.test or edit directly here
export const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    || 'admin@powerfitnessgym.com';
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

// Coach access code — an active coach's code in your test gym
export const COACH_CODE = process.env.TEST_COACH_CODE || '';

/**
 * Login as admin for the test gym.
 * Call this at the start of any test that needs an authenticated admin session.
 */
export async function adminLogin(page) {
  await page.goto(`/${GYM_SLUG}/admin/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/${GYM_SLUG}/admin`);
}

/**
 * Wait for the page to finish loading (spinner gone).
 */
export async function waitForLoad(page) {
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
}
