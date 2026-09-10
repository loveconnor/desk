import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
const material = (hex: number, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex).convertSRGBToLinear(),
    roughness,
  });
function add(
  g: THREE.Object3D,
  geo: THREE.BufferGeometry,
  m: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  g.add(o);
  return o;
}
function canvas(
  size: number,
  draw: (c: CanvasRenderingContext2D) => void,
  color = true,
) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  if (color) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  return t;
}
function weave() {
  const t = canvas(
    128,
    (c) => {
      c.fillStyle = "#888";
      c.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 4)
        for (let x = 0; x < 128; x += 4) {
          const over = (x + y) % 8 === 0;
          c.fillStyle = over ? "#b4b4b4" : "#646464";
          c.fillRect(x, y, over ? 3 : 1, over ? 1 : 3);
        }
    },
    false,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function createWovenRug(w: number, d: number, color: string) {
  const rug = new THREE.Group();
  rug.name = "Woven wool rug with bound edges";
  const textile = material(0xffffff, 0.99);
  textile.map = canvas(1024, (c) => {
    c.fillStyle = color;
    c.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 14000; i++) {
      const x = (Math.sin(i * 127.1) * 43758.5) % 1,
        y = (Math.sin(i * 311.7) * 12345.6) % 1;
      c.fillStyle = i % 2 ? "rgba(255,246,219,.045)" : "rgba(37,40,32,.04)";
      c.fillRect(Math.abs(x) * 1024, Math.abs(y) * 1024, 1 + (i % 7), 0.65);
    }
    c.strokeStyle = "rgba(228,216,187,.48)";
    c.lineWidth = 8;
    c.strokeRect(31, 31, 962, 962);
    c.lineWidth = 2;
    c.strokeRect(44, 44, 936, 936);
  });
  textile.bumpMap = weave();
  textile.bumpMap.repeat.set(w / 145, d / 145);
  textile.bumpScale = 1.3;
  const edge = material(
    new THREE.Color(color).multiplyScalar(0.86).getHex(),
    0.98,
  );
  add(rug, new RoundedBoxGeometry(w, 10, d, 3, 4), edge, 0, 5, 0).castShadow =
    false;
  const geo = new THREE.PlaneGeometry(w - 10, d - 10, 30, 30);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i);
    p.setZ(i, 0.45 * Math.sin(x / 110) * Math.sin(y / 140));
  }
  geo.computeVertexNormals();
  const top = add(rug, geo, textile, 0, 12, 0);
  top.rotation.x = -Math.PI / 2;
  top.castShadow = false;
  const a = w / 2 - 7,
    b = d / 2 - 7,
    r = 16;
  const points: THREE.Vector3[] = [];
  for (const [x, z, start] of [
    [a - r, b - r, 0],
    [-a + r, b - r, 90],
    [-a + r, -b + r, 180],
    [a - r, -b + r, 270],
  ]) {
    for (let i = 0; i <= 8; i++) {
      const angle = ((start + (i * 90) / 8) * Math.PI) / 180;
      points.push(
        new THREE.Vector3(x + r * Math.cos(angle), 8, z + r * Math.sin(angle)),
      );
    }
  }
  const seam = new THREE.CatmullRomCurve3(points, true, "centripetal");
  add(rug, new THREE.TubeGeometry(seam, 160, 2.3, 4, true), edge).castShadow =
    false;
  return rug;
}
export function createFloorLamp() {
  const group = new THREE.Group();
  group.name = "Linen floor lamp — open shade and metal fittings";
  const metal = material(0x292e2b, 0.35);
  metal.metalness = 0.7;
  const brass = material(0xa28a61, 0.3);
  brass.metalness = 0.8;
  const base = [
    [0, 0],
    [238, 0],
    [258, 7],
    [265, 17],
    [262, 28],
    [245, 37],
    [90, 41],
    [43, 48],
    [28, 65],
    [0, 65],
  ];
  add(
    group,
    new THREE.LatheGeometry(
      base.map(([r, y]) => new THREE.Vector2(r, y)),
      80,
    ),
    metal,
  );
  add(group, new THREE.CylinderGeometry(19, 22, 2760, 32), metal, 0, 1440, 0);
  for (const y of [76, 2670])
    add(group, new THREE.CylinderGeometry(30, 30, 25, 32), brass, 0, y, 0);
  const shadeMaterial = material(0xe4d6bc, 0.92);
  shadeMaterial.map = canvas(512, (c) => {
    c.fillStyle = "#f2ebdf";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 512; i += 2) {
      c.fillStyle = i % 6 ? "rgba(97,76,47,.035)" : "rgba(97,76,47,.08)";
      c.fillRect(i, 0, 1, 512);
      c.fillRect(0, i, 512, 0.5);
    }
  });
  shadeMaterial.bumpMap = weave();
  shadeMaterial.bumpMap.repeat.set(12, 4);
  shadeMaterial.bumpScale = 0.4;
  shadeMaterial.emissive.setHex(0xffb96e);
  const shade = add(
    group,
    new THREE.CylinderGeometry(270, 430, 520, 96, 1, true),
    shadeMaterial,
    0,
    2960,
    0,
  );
  shade.castShadow = false;
  const lining = material(0xf3e6cc, 0.95);
  lining.side = THREE.BackSide;
  lining.emissive.setHex(0xffc984);
  add(
    group,
    new THREE.CylinderGeometry(265, 425, 518, 96, 1, true),
    lining,
    0,
    2960,
    0,
  ).castShadow = false;
  for (const [radius, y] of [
    [430, 2700],
    [270, 3220],
  ]) {
    const rim = add(
      group,
      new THREE.TorusGeometry(radius, 6, 8, 96),
      shadeMaterial,
      0,
      y,
      0,
    );
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = false;
  }
  add(group, new THREE.CylinderGeometry(42, 37, 90, 32), brass, 0, 2790, 0);
  const glass = material(0xfff0d5, 0.35);
  glass.emissive.setHex(0xffd29c);
  const globe = add(
    group,
    new THREE.SphereGeometry(69, 32, 24),
    glass,
    0,
    2895,
    0,
  );
  globe.scale.y = 1.23;
  globe.castShadow = false;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(0, 3170, 0),
      new THREE.Vector3(Math.cos(a) * 264, 3214, Math.sin(a) * 264),
    );
    add(
      group,
      new THREE.TubeGeometry(curve, 1, 4, 6, false),
      brass,
    ).castShadow = false;
  }
  add(group, new THREE.CylinderGeometry(9, 9, 220, 16), brass, 0, 3090, 0);
  add(group, new THREE.SphereGeometry(17, 16, 12), brass, 0, 3225, 0);
  const cord = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 15, -240),
    new THREE.Vector3(-55, 7, -315),
    new THREE.Vector3(-85, 7, -450),
    new THREE.Vector3(-45, 7, -570),
  ]);
  add(group, new THREE.TubeGeometry(cord, 24, 5, 6, false), metal);
  const light = new THREE.PointLight(0xffcc88, 1.65, 10000, 2);
  light.position.set(0, 2870, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0001;
  light.shadow.normalBias = 2;
  light.shadow.camera.near = 40;
  light.shadow.camera.far = 15000;
  group.add(light);
  const setOn = (on: boolean) => {
    light.intensity = on ? 1.65 : 0;
    shadeMaterial.emissiveIntensity = on ? 0.22 : 0;
    lining.emissiveIntensity = on ? 0.36 : 0;
    glass.emissiveIntensity = on ? 1.1 : 0;
  };
  setOn(true);
  return { group, shade, light, setOn };
}
