import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
const mat = (hex: number, roughness = 0.7) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex).convertSRGBToLinear(),
    roughness,
  });
function mesh(
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
function box(
  g: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  m: THREE.Material,
  r = 3,
) {
  return mesh(g, new RoundedBoxGeometry(w, h, d, 3, r), m, x, y, z);
}
function texture(draw: (ctx: CanvasRenderingContext2D) => void, size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return t;
}
function oakMaterial() {
  const m = mat(0xffffff, 0.48);
  m.map = texture((ctx) => {
    ctx.fillStyle = "#b68b5e";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 650; i++) {
      ctx.strokeStyle = `rgba(${i % 3 ? "76,48,24" : "232,204,158"},${0.035 + (i % 7) * 0.008})`;
      ctx.lineWidth = 0.5 + (i % 4) * 0.25;
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 8) {
        const y =
          i * 0.79 +
          Math.sin(x * 0.013 + i * 0.71) * 2.6 +
          Math.sin(x * 0.029 + i) * 0.6;
        if (!x) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  m.bumpMap = m.map;
  m.bumpScale = 0.22;
  return m;
}
function book(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  hex: number,
  title: string,
) {
  const g = new THREE.Group();
  parent.add(g);
  const cover = mat(hex, 0.83),
    paper = mat(0xe4dbc8, 0.96);
  paper.map = texture((ctx) => {
    ctx.fillStyle = "#eee7d7";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 512; i += 3) {
      ctx.fillStyle = i % 4 ? "rgba(75,58,37,.07)" : "rgba(75,58,37,.14)";
      ctx.fillRect(0, i, 512, 0.6);
    }
  });
  box(g, width - 7, height - 10, depth - 10, 0, height / 2, 0, paper, 1);
  for (const x of [-width / 2 + 2, width / 2 - 2])
    box(g, 4, height, depth, x, height / 2, 0, cover, 1);
  box(g, width, height, 7, 0, height / 2, depth / 2 - 2, cover, 2);
  const label = texture((ctx) => {
    ctx.fillStyle = `#${hex.toString(16).padStart(6, "0")}`;
    ctx.fillRect(0, 0, 512, 512);
    ctx.save();
    ctx.translate(256, 260);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#ece3cb";
    ctx.textAlign = "center";
    ctx.font = "28px Georgia";
    ctx.fillText(title, 0, 0, 410);
    ctx.restore();
    ctx.fillStyle = "#cfbb94";
    ctx.fillRect(70, 438, 372, 3);
    ctx.fillRect(70, 66, 372, 3);
  });
  const front = mat(0xffffff);
  front.map = label;
  front.polygonOffset = true;
  front.polygonOffsetFactor = -2;
  front.polygonOffsetUnits = -4;
  const spinePrint = mesh(
    g,
    new THREE.PlaneGeometry(width - 2, height - 3),
    front,
    0,
    height / 2,
    depth / 2 + 1.6,
  );
  spinePrint.castShadow = spinePrint.receiveShadow = false;
  return g;
}
export function createShelfCabinet() {
  const oak = oakMaterial(),
    dark = mat(0x303a36, 0.55),
    black = mat(0x202523, 0.72),
    brass = mat(0xb5a17b, 0.32);
  brass.metalness = 0.75;
  const cabinet = new THREE.Group();
  cabinet.name = "Oak side cabinet — inset doors and recessed plinth";
  cabinet.position.set(3010, -2305, -1390);
  // Separate carcass panels and a recessed toe kick, all supported at floor level.
  box(cabinet, 1270, 85, 610, 0, 42.5, 0, black, 5);
  box(cabinet, 1410, 40, 705, 0, 105, 0, oak, 4);
  for (const x of [-695, 695]) box(cabinet, 40, 1070, 705, x, 640, 0, oak, 4);
  box(cabinet, 1350, 1050, 24, 0, 640, -340, oak, 2);
  box(cabinet, 1370, 35, 660, 0, 655, 0, oak, 3);
  box(cabinet, 1450, 65, 760, 0, 1195, 0, oak, 7);
  // Real door gaps expose the shadowed carcass instead of a single painted panel.
  for (const x of [-339, 339]) {
    box(cabinet, 665, 1006, 30, x, 649, 349, dark, 5);
    const px = x < 0 ? -36 : 36;
    for (const y of [865, 990]) box(cabinet, 13, 13, 22, px, y, 375, brass, 3);
    box(cabinet, 13, 150, 13, px, 927.5, 389, brass, 5);
  }
  const titles = ["ON DESIGN", "STUDIO NOTES", "FORM & SPACE"];
  const colors = [0x47645a, 0xb09d77, 0xa45e43];
  let top = 1227.5;
  for (let i = 0; i < 3; i++) {
    const b = book(
      cabinet,
      44 + i * 5,
      480 - i * 22,
      315,
      colors[i],
      titles[i],
    );
    b.rotation.z = -Math.PI / 2;
    b.rotation.y = [-0.035, 0.025, -0.018][i];
    b.position.set(-590, top + (44 + i * 5) / 2, 8);
    top += 44 + i * 5;
  }
  const ceramic = mat(0xdfd6c3, 0.32);
  ceramic.map = texture((ctx) => {
    ctx.fillStyle = "#f1ece1";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 6000; i++) {
      const x = (Math.sin(i * 127.1) * 43758.5) % 1,
        y = (Math.sin(i * 311.7) * 12345.6) % 1;
      ctx.fillStyle = "rgba(98,79,54,.13)";
      ctx.fillRect(Math.abs(x) * 512, Math.abs(y) * 512, 1, 1);
    }
  });
  ceramic.bumpMap = ceramic.map;
  ceramic.bumpScale = 0.18;
  const profile = [
    [0, 0],
    [58, 0],
    [74, 5],
    [91, 28],
    [105, 80],
    [98, 145],
    [73, 206],
    [57, 235],
    [56, 277],
    [54, 286],
    [46, 286],
    [44, 278],
    [45, 240],
    [59, 211],
    [82, 145],
    [87, 83],
    [65, 23],
    [0, 20],
  ];
  mesh(
    cabinet,
    new THREE.LatheGeometry(
      new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)))
        .getPoints(160)
        .map((p) => new THREE.Vector2(Math.max(0, p.x), p.y)),
      64,
    ),
    ceramic,
    405,
    1227.5,
    0,
  );
  const shelf = new THREE.Group();
  shelf.name = "Solid oak floating shelf with books and vinyl";
  shelf.position.set(2880, 840, -1800);
  box(shelf, 1550, 65, 400, 0, 0, 0, oak, 5);
  // The mounting plate sits behind the board, against the wall.
  box(shelf, 1180, 38, 12, 0, -5, -204, black, 2);
  for (let i = 0; i < 4; i++) {
    const b = book(
      shelf,
      65,
      320 + i * 24,
      228,
      colors[i % 3],
      ["DESIGN", "ARCHITECTURE", "CREATIVE WORK", "OBJECTS"][i],
    );
    b.position.set(-560 + i * 78, 32.5, -22);
  }
  // A folded printed record jacket and a partially exposed grooved black disc.
  const sleeve = new THREE.Group();
  sleeve.position.set(310, 32.5, -90);
  sleeve.rotation.x = -0.065;
  shelf.add(sleeve);
  const jacket = mat(0x28342f, 0.78);
  box(sleeve, 560, 560, 17, 0, 280, 0, jacket, 2);
  const art = texture((ctx) => {
    ctx.fillStyle = "#293b35";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#c28158";
    ctx.beginPath();
    ctx.arc(256, 242, 158, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(234,213,169,.24)";
    ctx.lineWidth = 0.7;
    for (let r = 65; r < 150; r += 6) {
      ctx.beginPath();
      ctx.arc(256, 242, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#e8d7ad";
    ctx.beginPath();
    ctx.arc(256, 242, 39, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#293b35";
    ctx.beginPath();
    ctx.arc(256, 242, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e6dac0";
    ctx.font = "20px sans-serif";
    ctx.fillText("STUDIO SELECTIONS", 30, 40);
    ctx.font = "11px sans-serif";
    ctx.fillText("SIDE A  /  LONG PLAY  /  33⅓ RPM", 30, 480);
  });
  const printed = mat(0xffffff, 0.8);
  printed.map = art;
  printed.polygonOffset = true;
  printed.polygonOffsetFactor = -2;
  printed.polygonOffsetUnits = -4;
  const sleevePrint = mesh(
    sleeve,
    new THREE.PlaneGeometry(552, 552),
    printed,
    0,
    280,
    9,
  );
  sleevePrint.castShadow = sleevePrint.receiveShadow = false;
  const vinyl = mat(0x171b19, 0.3);
  const disc = mesh(
    sleeve,
    new THREE.CylinderGeometry(263, 263, 3, 96),
    vinyl,
    0,
    338,
    -13,
  );
  disc.rotation.x = Math.PI / 2;
  for (let radius = 120; radius < 259; radius += 7)
    mesh(
      sleeve,
      new THREE.TorusGeometry(radius, 0.4, 3, 96),
      vinyl,
      0,
      338,
      -10.9,
    );
  return { cabinet, shelf };
}
