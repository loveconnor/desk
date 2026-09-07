import { test, expect } from '@playwright/test';
import { KeyboardState, keyRows } from '../src/keyboard/KeyboardState';

test('physical keys support chords, suppress repeat clicks, and release shortcuts', () => {
  const state = new KeyboardState();
  const clicks: string[] = [];
  state.listeners.add(code => clicks.push(code));
  const down = (code: string, repeat = false) => state.down({ code, key: code, repeat });
  down('ShiftLeft'); down('KeyA'); down('KeyA', true); down('KeyA');
  expect([...state.pressed]).toEqual(['ShiftLeft', 'KeyA']);
  expect(clicks).toEqual(['ShiftLeft', 'KeyA']);
  state.up({ code: 'KeyA' });
  expect([...state.pressed]).toEqual(['ShiftLeft']);
  state.reset();
  down('MetaLeft'); down('KeyC'); state.up({ code: 'MetaLeft' });
  expect(state.pressed.size).toBe(0);
  expect(keyRows.flat().filter(Boolean)).toHaveLength(new Set(keyRows.flat().filter(Boolean)).size);
});

test('desktop typing plays one click per press without swallowing input', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).keyboardClips = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('/audio/keyboard/')) (window as any).keyboardClips.push(this.src);
      return play.call(this);
    };
  });
  await page.goto('/desktop.html');
  await page.getByRole('button', { name: 'Terminal', exact: true }).click();
  await page.getByLabel('Terminal command').focus();
  await page.keyboard.down('a');
  await page.keyboard.down('a');
  await page.keyboard.up('a');
  await expect(page.getByLabel('Terminal command')).toHaveValue('aa');
  expect(await page.evaluate(() => (window as any).keyboardClips.length)).toBe(1);
  await page.keyboard.down('b');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('b');
  await page.keyboard.press('b');
  expect(await page.evaluate(() => (window as any).keyboardClips.length)).toBe(3);
});
