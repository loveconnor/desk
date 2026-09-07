import { test, expect } from '@playwright/test';

test('portfolio navigation stays inside the desktop browser', async ({ page, context }) => {
  // Keep navigation checks independent of the live portfolio's deployment and availability.
  await page.route('https://www.connorlove.com/**', route => route.fulfill({
    contentType: 'text/html',
    body: `<h1>${new URL(route.request().url()).pathname}</h1><a href="/projects/honestui">View project</a>`,
  }));
  await page.goto('/desktop.html');
  await page.getByRole('button', { name: 'Web Browser', exact: true }).click();
  const browser = page.getByRole('dialog', { name: 'Web Browser' });
  const content = browser.frameLocator('iframe');
  await expect(content.getByRole('heading')).toHaveText('/');
  await content.getByRole('link', { name: 'View project' }).click();
  await expect(content.getByRole('heading')).toHaveText('/projects/honestui');
  await browser.getByRole('button', { name: 'Portfolio home' }).click();
  await expect(content.getByRole('heading')).toHaveText('/');
  const address = browser.getByRole('textbox', { name: 'Web address' });
  await address.fill('www.connorlove.com/projects/honestui');
  await address.press('Enter');
  await expect(content.getByRole('heading')).toHaveText('/projects/honestui');
  await address.fill('https://example.com');
  await browser.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(address).toHaveJSProperty('validationMessage', 'Enter a valid connorlove.com address.');
  await expect(content.getByRole('heading')).toHaveText('/projects/honestui');
  expect(context.pages()).toHaveLength(1);
  await expect(page).toHaveURL(/\/desktop.html$/);
});
