import { test, expect } from '@playwright/test';
import Time from '../src/Application/Utils/Time';

test('the animation clock suspends, resumes once, and releases its callbacks', () => {
  const originalDocument = globalThis.document;
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const originalNow = Date.now;
  const document = Object.assign(new EventTarget(), { hidden: false });
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  let now = 1000;
  globalThis.document = document as unknown as Document;
  globalThis.requestAnimationFrame = callback => {
    frames.set(++id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = frame => { frames.delete(frame); };
  Date.now = () => now;
  const step = () => {
    const [id, callback] = frames.entries().next().value!;
    frames.delete(id);
    callback(now);
  };
  let clock: Time | undefined;
  try {
    clock = new Time();
    let ticks = 0;
    clock.on('tick', () => ticks++);
    expect(frames.size).toBe(1);
    now += 16;
    step();
    expect(ticks).toBe(1);
    expect(clock.delta).toBe(16);
    expect(frames.size).toBe(1);

    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    now += 60000;
    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(1);
    now += 16;
    step();
    expect(ticks).toBe(2);
    expect(clock.delta).toBe(16);
    expect(clock.elapsed).toBe(60032);

    document.dispatchEvent(new Event('loadingScreenDone'));
    expect(clock.start).toBe(now);
    clock.destroy();
    expect(frames.size).toBe(0);
    now += 1000;
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('loadingScreenDone'));
    expect(frames.size).toBe(0);
    expect(clock.start).toBe(now - 1000);

    document.hidden = true;
    clock = new Time();
    expect(frames.size).toBe(0);
    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(1);
  } finally {
    clock?.destroy();
    globalThis.document = originalDocument;
    globalThis.requestAnimationFrame = originalRequest;
    globalThis.cancelAnimationFrame = originalCancel;
    Date.now = originalNow;
  }
});
