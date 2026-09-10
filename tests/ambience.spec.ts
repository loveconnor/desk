import { test, expect } from '@playwright/test';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { apartmentMix } from '../src/Application/Audio/ApartmentAmbience';

let audioCode: string;
test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(new URL('../src/Application/Audio/ApartmentAmbience.ts', import.meta.url)),
        name: 'ApartmentAudio',
        formats: ['iife'],
      },
    },
  });
  const bundle = Array.isArray(result) ? result[0] : result;
  if (!('output' in bundle)) throw new Error('Expected an in-memory audio bundle');
  const chunk = bundle.output.find(item => item.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('Audio bundle missing');
  audioCode = chunk.code;
});

test('traffic follows the window, softens at night, and remains audible behind blinds', () => {
  const rotation = new THREE.Quaternion();
  const near = new THREE.Vector3(-2600, 1200, -500);
  const far = new THREE.Vector3(-6500, 5000, 7500);
  const day = apartmentMix(near, rotation, 1, 0);
  const distant = apartmentMix(far, rotation, 1, 0);
  const night = apartmentMix(near, rotation, 0, 0);
  const closed = apartmentMix(near, rotation, 1, 1);
  expect(day.cityVolume).toBeGreaterThan(distant.cityVolume);
  expect(day.cityFrequency).toBeGreaterThan(distant.cityFrequency);
  expect(night.cityVolume).toBeCloseTo(day.cityVolume / 2);
  expect(closed.cityVolume).toBeGreaterThan(day.cityVolume * 0.8);
  const left = apartmentMix(new THREE.Vector3(0, 1200, -500), rotation, 1, 0);
  const turned = apartmentMix(new THREE.Vector3(0, 1200, -500), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), 1, 0);
  expect(left.cityPan).toBeLessThan(0);
  expect(turned.cityPan).toBeGreaterThan(0);
});

test('real audio buffers decode and ambience never stacks or runs while hidden/muted', async ({ page }) => {
  await page.goto('/desktop.html');
  await page.addScriptTag({ content: audioCode });
  const result = await page.evaluate(async () => {
    const context = new AudioContext();
    const decode = async (path: string) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Missing ambience: ${path}`);
      return context.decodeAudioData(await response.arrayBuffer());
    };
    const [city, room] = await Promise.all([
      decode('/audio/atmosphere/nyc-loft.m4a'),
      decode('/audio/atmosphere/apartment-room.wav'),
    ]);
    let created = 0;
    const create = context.createBufferSource.bind(context);
    context.createBufferSource = () => { created++; return create(); };
    const manager = {
      listener: { context, getInput: () => context.destination },
      loadedAudio: { apartmentCity: city, apartmentRoom: room },
      application: {
        camera: { instance: { position: { x: 0, y: 1200, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } } },
        world: { room: { roomWindow: { daylight: 1, coverage: 0 } } },
      },
    };
    const audio = new (window as any).ApartmentAudio.default(manager);
    const emit = (name: string, detail?: boolean) => document.dispatchEvent(new CustomEvent(name, { detail }));
    emit('doorOpening');
    emit('doorOpening');
    emit('loadingScreenDone'); // Camera arrival must not start another loop.
    const initial = created;
    emit('muteToggle', true);
    const muted = !audio.city.isPlaying && !audio.room.isPlaying;
    emit('doorOpening');
    const mutedCount = created;
    emit('muteToggle', false);
    const resumed = audio.city.isPlaying && audio.room.isPlaying;
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    emit('visibilitychange');
    const hidden = !audio.city.isPlaying && !audio.room.isPlaying;
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    emit('visibilitychange');
    emit('doorClosed');
    const left = !audio.city.isPlaying && !audio.room.isPlaying;
    emit('doorOpening');
    const reentered = audio.city.isPlaying && audio.room.isPlaying;
    audio.destroy();
    const destroyed = !audio.city.isPlaying && !audio.room.isPlaying;
    const before = created;
    emit('doorOpening');
    emit('muteToggle', false);
    emit('visibilitychange');
    await context.close();
    delete (document as any).hidden;
    return { durations: [city.duration, room.duration], initial, muted, mutedCount, resumed, hidden, left, reentered, destroyed, afterDestroy: created - before };
  });
  expect(result.durations[0]).toBeCloseTo(118, 0);
  expect(result.durations[1]).toBeCloseTo(14, 1);
  expect(result.initial).toBe(2);
  expect(result.mutedCount).toBe(2);
  for (const key of ['muted', 'resumed', 'hidden', 'left', 'reentered', 'destroyed'] as const)
    expect(result[key], key).toBe(true);
  expect(result.afterDestroy).toBe(0);
});
