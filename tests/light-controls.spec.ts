import { test, expect } from '@playwright/test';
import LightControls from '../src/Application/World/LightControls';
import UIEventBus from '../src/Application/UI/EventBus';

test('fixture switches and panel commands share state and all-off removes indoor fill', () => {
  const originalDocument = globalThis.document;
  const dispatch = UIEventBus.dispatch;
  globalThis.document = new EventTarget() as unknown as Document;
  let snapshot: Array<{ id: string; on: boolean }> = [];
  UIEventBus.dispatch = (name, data) => { if (name === 'roomLightsState') snapshot = data; };
  try {
    const controls = new LightControls();
    let ceilingIntensity = 1.15;
    let shadeEmission = 0.7;
    const physicalSwitch = controls.register('ceiling', 'Office ceiling light', on => {
      ceilingIntensity = on ? 1.15 : 0;
      shadeEmission = on ? 0.7 : 0;
    });
    controls.register('reading', 'Reading lamp', () => {});
    controls.register('hallway', 'Hallway lights', () => {});
    physicalSwitch();
    expect(snapshot.find(light => light.id === 'ceiling')!.on).toBe(false);
    expect(ceilingIntensity).toBe(0);
    expect(shadeEmission).toBe(0);
    expect(controls.indoorFill).toBe(0.5);
    document.dispatchEvent(new CustomEvent('roomLightsCommand', { detail: { id: 'ceiling', on: true } }));
    expect(ceilingIntensity).toBe(1.15);
    expect(shadeEmission).toBe(0.7);
    document.dispatchEvent(new CustomEvent('roomLightsCommand', { detail: { id: 'all', on: false } }));
    expect(snapshot.every(light => !light.on)).toBe(true);
    expect(controls.indoorFill).toBe(0);
    physicalSwitch();
    expect(ceilingIntensity).toBe(1.15);
    expect(snapshot.find(light => light.id === 'ceiling')!.on).toBe(true);
    document.dispatchEvent(new CustomEvent('roomLightsCommand', { detail: { id: 'all', on: true } }));
    expect(snapshot.every(light => light.on)).toBe(true);
    expect(controls.indoorFill).toBe(1);
  } finally {
    globalThis.document = originalDocument;
    UIEventBus.dispatch = dispatch;
  }
});
