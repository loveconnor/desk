import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

test('mobile loads the full room without retired assets or concurrent book decodes', async ({ page }) => {
  test.setTimeout(180000);
  let active = 0;
  let peak = 0;
  let books = 0;
  const legacy: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/\/models\/(Computer|World|Decor)\//.test(request.url())) legacy.push(request.url());
  });
  await page.route('**/room/books/*', async route => {
    peak = Math.max(peak, ++active);
    books++;
    try {
      const response = await route.fetch();
      await route.fulfill({ response });
    } finally {
      active--;
    }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'START', exact: true });
  await expect(start).toBeEnabled({ timeout: 150000 });
  expect(legacy).toEqual([]);
  expect(books).toBeGreaterThan(48);
  expect(peak).toBe(1);
  await start.tap();
  await expect(page.locator('.door-entry')).toHaveClass(/is-finished/, { timeout: 15000 });
  await expect(page.locator('.desktop-shortcut')).toBeVisible();
  expect(errors).toEqual([]);
});
