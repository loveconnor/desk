import { test, expect } from '@playwright/test';
import { browserDestination } from '../src/desktop/Browser';

test('portfolio and project shortcuts load inside one iframe without a browser backend', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('websocket', socket => requests.push(socket.url()));
  for (const host of ['www.connorlove.com', 'www.honestui.com', 'tokenizer.connorlove.com']) {
    await page.route(`https://${host}/**`, route => route.fulfill({ contentType: 'text/html', body: `<h1>${host}</h1><a href="/details">Details</a>` }));
  }
  await page.goto('/desktop.html');
  await page.getByRole('button', {name:'Web Browser',exact:true}).click();
  const browser = page.getByRole('dialog', {name:'Web Browser'});
  const content = browser.frameLocator('iframe');
  await expect(content.getByRole('heading')).toHaveText('www.connorlove.com');
  await browser.getByRole('button',{name:'HonestUI',exact:true}).click();
  await expect(content.getByRole('heading')).toHaveText('www.honestui.com');
  await content.getByRole('link',{name:'Details'}).click();
  await expect(browser.locator('iframe')).toHaveCount(1);
  await browser.getByRole('button',{name:'Tokenizer',exact:true}).click();
  await expect(content.getByRole('heading')).toHaveText('tokenizer.connorlove.com');
  await browser.getByRole('button',{name:'Reload page',exact:true}).click();
  await expect(content.getByRole('heading')).toHaveText('tokenizer.connorlove.com');
  await browser.getByRole('button',{name:'Portfolio home',exact:true}).click();
  await expect(content.getByRole('heading')).toHaveText('www.connorlove.com');
  expect(context.pages()).toHaveLength(1);
  expect(requests.filter(url=>url.includes('/api/browser'))).toEqual([]);
  await expect(browser.locator('canvas')).toHaveCount(0);
});

test('project names work in address bar and unrelated searches do not leave the site', async ({page,context}) => {
  await page.route('https://www.connorlove.com/**', route=>route.fulfill({contentType:'text/html',body:'<h1>Portfolio</h1>'}));
  await page.route('https://www.honestui.com/**', route=>route.fulfill({contentType:'text/html',body:'<h1>HonestUI</h1>'}));
  await page.goto('/desktop.html');
  await page.getByRole('button',{name:'Web Browser',exact:true}).click();
  const browser=page.getByRole('dialog',{name:'Web Browser'});
  const address=browser.getByRole('textbox',{name:'Web address'});
  await address.fill('honestui'); await address.press('Enter');
  await expect(browser.frameLocator('iframe').getByRole('heading')).toHaveText('HonestUI');
  await address.fill('espn'); await address.press('Enter');
  await expect(address).toHaveJSProperty('validationMessage','Enter a Connor Love project address or choose a project below.');
  await expect(browser.frameLocator('iframe').getByRole('heading')).toHaveText('HonestUI');
  expect(context.pages()).toHaveLength(1);
});

test('address validation accepts project domains and rejects unrelated or disguised hosts', () => {
  expect(browserDestination('honestui').url).toBe('https://www.honestui.com');
  expect(browserDestination('tokenizer.connorlove.com/demo').url).toBe('https://tokenizer.connorlove.com/demo');
  expect(browserDestination('colors.connorlove.com').url).toBe('https://colors.connorlove.com/');
  for(const address of ['google.com','connorlove.com.evil.com','evilconnorlove.com','https://user:password@honestui.com','javascript:alert(1)','file:///etc/passwd']) expect(()=>browserDestination(address)).toThrow();
});
