import { test, expect } from '@playwright/test';

for (const mobile of [false, true]) test.describe(mobile ? 'phone' : 'desktop', () => {
  test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });

test('room shaders link within the GPU sampler limit without asset warnings', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('console', message => {
    if (/THREE\.|WebGL:/.test(message.text()) && ['warning', 'error'].includes(message.type()))
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    (window as any).shaderFailures = [];
    (window as any).samplerCounts = [];
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const link = Context.prototype.linkProgram;
      Context.prototype.linkProgram = function (program) {
        link.call(this, program);
        if (!this.getProgramParameter(program, this.LINK_STATUS)) {
          (window as any).shaderFailures.push(this.getProgramInfoLog(program));
          return;
        }
        let count = 0;
        for (let i = 0; i < this.getProgramParameter(program, this.ACTIVE_UNIFORMS); i++) {
          const uniform = this.getActiveUniform(program, i)!;
          if (uniform.type === this.SAMPLER_2D || uniform.type === this.SAMPLER_CUBE)
            count += uniform.size;
        }
        (window as any).samplerCounts.push(count);
      };
    }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'START', exact: true })).toBeEnabled({ timeout: 60000 });
  await page.getByRole('button', { name: 'START', exact: true }).click();
  await expect(page.locator('.door-entry')).toHaveClass(/is-finished/, { timeout: 15000 });
  expect(await page.evaluate(() => (window as any).shaderFailures)).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => Math.max(...(window as any).samplerCounts))).toBeLessThanOrEqual(16);
});

});
