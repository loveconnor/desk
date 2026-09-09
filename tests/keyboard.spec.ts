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

test('Air75 has 84 keys and keeps every row inside the case with equal side clearance', async () => {
  const { air75Keys, AIR75_SIZE } = await import('../src/keyboard/Air75Layout');
  expect(air75Keys).toHaveLength(84);
  expect(new Set(air75Keys.map(key => key.code)).size).toBe(84);
  for (let row = 0; row < 6; row++) {
    const keys = air75Keys.filter(key => key.row === row);
    expect(keys.reduce((sum, key) => sum + key.units, 0)).toBe(16);
    const intervals = keys.map(key => ({
      left: (key.x - key.units / 2) * AIR75_SIZE.pitch + 0.55,
      right: (key.x + key.units / 2) * AIR75_SIZE.pitch - 0.55,
    }));
    expect(intervals[0].left + AIR75_SIZE.width / 2).toBeCloseTo(6);
    expect(AIR75_SIZE.width / 2 - intervals.at(-1)!.right).toBeCloseTo(6);
    intervals.slice(1).forEach((interval, i) => {
      expect(interval.left - intervals[i].right).toBeCloseTo(1.1);
    });
  }
});
