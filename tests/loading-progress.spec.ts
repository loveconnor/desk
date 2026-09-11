import { test, expect } from '@playwright/test';
import Loading from '../src/Application/Utils/Loading';
import { assetLoadingManager } from '../src/Application/Utils/assetLoading';
import UIEventBus from '../src/Application/UI/EventBus';

test('late-discovered assets never move progress backward or finish before the first frame', () => {
  const dispatch = UIEventBus.dispatch;
  const events: Array<{ name: string; data: any }> = [];
  UIEventBus.dispatch = (name, data) => { events.push({ name, data }); };
  const loading = new Loading();
  try {
    assetLoadingManager.onProgress('initial-assets', 88, 100);
    expect(loading.progress).toBe(0.88);

    // Room construction adds textures and models after initial assets finish.
    assetLoadingManager.onProgress('room-assets', 89, 105);
    expect(loading.progress).toBe(0.88);
    assetLoadingManager.onProgress('room-assets', 100, 105);
    expect(loading.progress).toBeCloseTo(100 / 105);
    assetLoadingManager.onProgress('last-asset', 105, 105);
    expect(loading.progress).toBe(0.99);
    loading.completeFirstFrame();
    expect(loading.ready).toBe(false);

    loading.assetsReady = true;
    loading.completeFirstFrame();
    expect(loading.ready).toBe(true);
    expect(loading.progress).toBe(1);
    assetLoadingManager.onProgress('later-asset', 106, 110);
    expect(loading.progress).toBe(1);

    const progress = events.filter(event => event.name === 'loadedSource').map(event => event.data.progress);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
    expect(progress.at(-1)).toBe(1);
    expect(events.filter(event => event.name === 'roomReady')).toHaveLength(1);
  } finally {
    // Clear the watchdog even when an assertion fails.
    loading.assetsReady = true;
    loading.completeFirstFrame();
    UIEventBus.dispatch = dispatch;
  }
});
