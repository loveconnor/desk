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

for (const asset of ['**/room/books/*', '**/models/logitech-z207/*.glb*']) {
  test(`entry waits for room assets: ${asset}`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 900, height: 650 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let release!: () => void;
    let requested!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const assetRequested = new Promise<void>(resolve => { requested = resolve; });
    await page.route(asset, async route => {
      requested();
      await held;
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await assetRequested;
    const start = page.getByRole('button', { name: 'START', exact: true });
    try {
      await expect(start).toBeDisabled();
      await page.keyboard.press('Enter');
      await expect(page.locator('#boot-screen')).toBeVisible();
      await expect(page.locator('.door-entry')).not.toHaveClass(/is-ready|is-opening/);
      await expect(page.locator('.entry-progress')).not.toHaveAttribute('aria-valuenow', '100');
    } finally {
      release();
    }
    await expect(start).toBeEnabled({ timeout: 60000 });
    await expect(page.locator('#boot-screen')).toBeHidden();
    await start.click();
    await expect(page.locator('.door-entry')).toHaveClass(/is-finished/, { timeout: 15000 });
  });
}

test('preloader waits for the first rendered and positioned room frame', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 900, height: 650 });
  await page.addInitScript(() => {
    let draws = 0;
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const original = Context.prototype.drawElements;
      Context.prototype.drawElements = function (...args) {
        draws++;
        return original.apply(this, args);
      };
    }
    document.addEventListener('roomReady', () => {
      const iframe = document.getElementById('computer-screen');
      (window as any).firstRoomFrame = {
        draws,
        transform: iframe?.parentElement?.style.transform ?? '',
      };
    });
    (window as any).desktopFlashes = [];
    const check = () => {
      const iframe = document.getElementById('computer-screen');
      const boot = document.getElementById('boot-screen');
      if (iframe && boot?.hidden && getComputedStyle(iframe).visibility === 'visible'
          && !iframe.parentElement?.style.transform.includes('matrix3d')) {
        (window as any).desktopFlashes.push(performance.now());
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'START', exact: true })).toBeEnabled({ timeout: 60000 });
  const frame = await page.evaluate(() => (window as any).firstRoomFrame);
  expect(frame.draws).toBeGreaterThan(0);
  expect(frame.transform).toContain('matrix3d');
  expect(await page.evaluate(() => (window as any).desktopFlashes)).toEqual([]);
  await expect(page.locator('#boot-screen')).toBeHidden();
});

for (const failure of ['decode rejection', 'decode hang', 'audio request', 'book image', 'speaker model']) {
  test(`entry recovers from ${failure}`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 900, height: 650 });
    if (failure.startsWith('decode')) {
      await page.addInitScript((hang) => {
        BaseAudioContext.prototype.decodeAudioData = function () {
          return hang ? new Promise(() => {}) : Promise.reject(new DOMException('Unsupported audio', 'EncodingError'));
        };
      }, failure === 'decode hang');
    } else {
      const pattern = failure === 'audio request' ? '**/audio/door/open.mp3'
        : failure === 'book image' ? '**/room/books/*' : '**/models/logitech-z207/*.glb*';
      await page.route(pattern, route => route.abort());
    }
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'START', exact: true })).toBeEnabled({ timeout: 60000 });
    await expect(page.locator('#boot-screen')).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('a required texture failure offers the working desktop instead of a stuck percentage', async ({ page }) => {
  await page.route('**/smudges.jpg', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#boot-status')).toHaveText('Room unavailable — open the desktop below');
  await expect(page.locator('.entry-progress')).toBeHidden();
  await page.locator('.entry-skip').click();
  await expect(page).toHaveURL(/desktop.html/);
});

test('a request that never finishes stops displaying fake progress', async ({ page }) => {
  await page.addInitScript(() => {
    const timeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: any[]) =>
      timeout(handler, delay === 45000 ? 1000 : delay, ...args)) as typeof window.setTimeout;
  });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/smudges.jpg', async route => {
    await held;
    await route.abort();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#boot-status')).toHaveText('Room unavailable — open the desktop below', { timeout: 10000 });
    await expect(page.locator('.entry-progress')).toBeHidden();
    await expect(page.locator('.entry-skip')).toBeVisible();
    await expect(page.getByRole('button', { name: 'START', exact: true })).toBeDisabled();
  } finally {
    release();
  }
});

test('a first-frame rendering exception leaves a usable desktop fallback', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      Context.prototype.drawElements = function () {
        throw new Error('Simulated GPU rendering failure');
      };
    }
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#boot-status')).toHaveText('Room unavailable — open the desktop below', { timeout: 60000 });
  await expect(page.locator('#boot-screen')).toBeVisible();
  await expect(page.locator('.entry-skip')).toBeVisible();
  await expect(page.getByRole('button', { name: 'START', exact: true })).toBeDisabled();
});
