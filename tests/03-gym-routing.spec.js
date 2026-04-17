import { test, expect } from '@playwright/test';
import { GYM_SLUG } from './helpers.js';

test.describe('Gym Slug Routing', () => {

  test('valid slug loads the gym portal page', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    // Should show the gym portal with 3 entry cards
    await expect(page.locator('text=Member Portal')).toBeVisible();
    await expect(page.locator('text=Gym Check-In')).toBeVisible();
    await expect(page.locator('text=Admin Portal')).toBeVisible();
  });

  test('gym portal shows the gym name', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    // Gym name from settings should appear (not just "MadeForGyms")
    await expect(page.locator('h1')).not.toBeEmpty();
  });

  test('gym portal has Powered by MadeForGyms link', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}`);
    await expect(page.locator('a:has-text("Powered by MadeForGyms")')).toBeVisible();
  });

  test('wrong slug shows GymNotFound page', async ({ page }) => {
    await page.goto('/this-gym-does-not-exist-xyz123');
    await expect(page.locator('text=Gym not found')).toBeVisible();
    await expect(page.locator('text=this-gym-does-not-exist-xyz123')).toBeVisible();
  });

  test('GymNotFound shows list of active gyms as cards', async ({ page }) => {
    await page.goto('/this-gym-does-not-exist-xyz123');
    await expect(page.locator('text=Active Gyms on MadeForGyms')).toBeVisible();
    // At least one gym card (powerfitnessgym) should appear
    const cards = page.locator('button:has(text("madeforgyms.com/"))');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking a gym card on GymNotFound navigates to that gym', async ({ page }) => {
    await page.goto('/this-gym-does-not-exist-xyz123');
    // Wait for gym cards to load
    const firstCard = page.locator('button:has(text("madeforgyms.com/"))').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    // Should now be on a gym portal page
    await expect(page.locator('text=Member Portal')).toBeVisible();
  });

  test('GymNotFound Back to MadeForGyms goes to /', async ({ page }) => {
    await page.goto('/wrongslug999');
    await page.click('a:has-text("Back to MadeForGyms")');
    await expect(page).toHaveURL('/');
  });

  test('/:slug with unknown sub-path redirects to gym portal', async ({ page }) => {
    await page.goto(`/${GYM_SLUG}/unknownpage`);
    await expect(page).toHaveURL(new RegExp(`/${GYM_SLUG}$`));
  });

});
