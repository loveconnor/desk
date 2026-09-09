import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true });
try {
  await mkdir('output', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/air75-preview', route => route.fulfill({ contentType: 'text/html', body: '<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0"></body>' }));
  await page.goto(`${process.env.AIR75_PREVIEW_URL || 'http://localhost:4186'}/air75-preview`);
  const metrics = await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { default: Keyboard } = await import('/src/Application/World/NuphyAir75.ts');
    const { default: Mat } = await import('/src/Application/World/NordikDeskMat.ts');
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(1500, 950); renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    const scene = new T.Scene(); scene.background = new T.Color('#c1c1bd');
    const keyboard = new Keyboard(renderer); scene.add(keyboard);
    const mat = new Mat(renderer.capabilities.getMaxAnisotropy());
    mat.scale.setScalar(1 / 2.25); mat.position.set(20, -4, 0); scene.add(mat);
    scene.add(new T.HemisphereLight(0xfff8ed, 0x737579, 1.05));
    const sun = new T.DirectionalLight(0xfff7e8, 1.2); sun.position.set(-250, 600, 350);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -500, right: 500, top: 500, bottom: -500, near: 1, far: 1500 });
    sun.shadow.normalBias = 0.1; sun.shadow.bias = -0.00001; scene.add(sun);
    const camera = new T.PerspectiveCamera(37, 1500 / 950, 1, 5000);
    camera.position.set(80, 320, 380); camera.lookAt(0, 0, 0);
    const render = () => renderer.render(scene, camera);
    window.air75Preview = { T, scene, renderer, camera, keyboard, mat, render };
    render();
    const bounds = new T.Box3().setFromObject(keyboard);
    let triangles = 0;
    keyboard.traverse(o => { if (o.isMesh) triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3; });
    const clearances = [...keyboard.keys].map(([code, key]) => {
      const b = new T.Box3().setFromObject(key);
      return { code, left: b.min.x + 315.7 / 2, right: 315.7 / 2 - b.max.x };
    });
    const minimumSideClearance = Math.min(...clearances.flatMap(c => [c.left, c.right]));
    if (minimumSideClearance < 5.9) throw new Error(`Keycap clearance only ${minimumSideClearance} mm`);
    return { minimumSideClearance, keyCount: keyboard.keys.size, bounds: { min: bounds.min, max: bounds.max }, triangles };
  });
  await page.screenshot({ path: 'output/nuphy-air75-perspective.png' });
  await page.evaluate(() => {
    const { camera, render } = window.air75Preview;
    camera.position.set(0, 490, 0.01); camera.lookAt(0, 0, 0); render();
  });
  await page.screenshot({ path: 'output/nuphy-air75-top.png' });
  // A press must move the cap and its printing together and return to rest.
  const travel = await page.evaluate(() => {
    const { keyboard } = window.air75Preview;
    const key = keyboard.keys.get('KeyA');
    const before = key.position.y; key.position.y -= key.userData.travel;
    const delta = before - key.position.y; key.position.y = key.userData.restY;
    return { delta, restored: key.position.y === before, legendAttached: key.children.some(c => c.name === 'KeyA printed legend') };
  });
  const downloadPromise = page.waitForEvent('download');
  downloadPromise.catch(() => {});
  await page.evaluate(async () => {
    const { GLTFExporter } = await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');
    const { keyboard } = window.air75Preview;
    const model = keyboard; model.scale.setScalar(0.001);
    const exporter = new GLTFExporter();
    await new Promise((resolve, reject) => exporter.parse(model, result => {
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(new Blob([result], { type: 'model/gltf-binary' }));
      anchor.download = 'nuphy-air75.glb'; anchor.click(); resolve();
    }, reject, { binary: true }));
  });
  await (await downloadPromise).saveAs('output/nuphy-air75.glb');
  console.log(JSON.stringify({ metrics, travel, errors }, null, 2));
  if (errors.length || metrics.keyCount !== 84 || !travel.restored || !travel.legendAttached || Math.abs(travel.delta - 3.2) > 1e-5) process.exitCode = 1;
} finally { await browser.close(); }
