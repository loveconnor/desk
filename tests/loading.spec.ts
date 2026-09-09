import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`refresh has a styled entry before JavaScript at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // Reproduce a slow/blocked app bundle: the first paint must stand alone.
    await page.route('**/*.js', route => route.abort());
    await page.goto('/');
    await expect(page.locator('#boot-screen')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Connor Love', exact: true })).toBeVisible();
    await expect(page.locator('.desktop-shortcut')).toBeHidden();
    await expect(page.locator('.entry-progress')).toHaveAttribute('aria-valuenow', '0');
    const box = await page.locator('.portfolio-arrow').evaluate(element => ({ width: element.getAttribute('width'), height: element.getAttribute('height') }));
    expect(box).toEqual({ width: '13', height: '13' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
    await page.screenshot({ path: `test-results/loading-${viewport.width}.png` });
    await page.reload();
    await expect(page.locator('.desktop-shortcut')).toBeHidden();
    await expect(page.locator('#boot-screen')).toBeVisible();
  });
}

test('the loading composition hands off to the working entrance', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 900, height: 650 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    (window as any).doorSounds = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && !this.loop && this.buffer.duration > 1.5 && this.buffer.duration < 2.1)
        (window as any).doorSounds.push(this.buffer.duration);
      return start.apply(this, args);
    };
  });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'START', exact: true });
  await expect(start).toBeEnabled({ timeout: 60000 });
  await expect(page.locator('#boot-screen')).toBeHidden();
  await page.locator('.door-entry-prompt').screenshot({ path: 'test-results/door-prompt.png' });
  await start.click();
  await expect.poll(() => page.evaluate(() => (window as any).doorSounds.length)).toBe(1);
  await expect(page.locator('.door-entry')).toHaveClass(/is-finished/, { timeout: 15000 });
  await expect(page.locator('.desktop-shortcut')).toBeVisible();
  expect(errors).toEqual([]);
});
