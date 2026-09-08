import { test, expect } from '@playwright/test';

test('Escape reverses the entrance and the closed door can be opened again', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const start = page.getByRole('button', { name: 'START', exact: true });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator('.door-entry')).toHaveClass(/is-finished/, { timeout: 12000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('.door-entry')).not.toHaveClass(/is-finished/);
  await expect(start).toBeDisabled();
  // Extra key presses during travel must not interrupt or duplicate the sequence.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');
  await expect(start).toBeEnabled({ timeout: 12000 });
  await expect(page.locator('.door-entry')).not.toHaveClass(/is-opening/);
  await page.screenshot({ path: 'test-results/returned-door.png' });
  await page.keyboard.press('Enter');
  await expect(page.locator('.door-entry')).toHaveClass(/is-finished/, { timeout: 12000 });
  // Verify another complete cycle with reduced motion enabled.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('Escape');
  await expect(start).toBeEnabled({ timeout: 3000 });
  await start.click();
  await expect(page.locator('.door-entry')).toHaveClass(/is-finished/, { timeout: 3000 });
  expect(errors).toEqual([]);
});
