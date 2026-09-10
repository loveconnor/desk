import * as THREE from "three";

type Note = { title: string; subtitle: string; body: string };
const mat = (hex: number, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex).convertSRGBToLinear(),
    roughness,
  });
function add(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  return texture;
}
function randomSource() {
  let state = 78125;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function corkTexture() {
  const rand = randomSource();
  return canvasTexture(1024, (ctx) => {
    ctx.fillStyle = "#ae8355";
    ctx.fillRect(0, 0, 1024, 1024);
    // Irregular compressed cork chips, with fine pores between the granules.
    for (let i = 0; i < 160000; i++) {
      const x = rand() * 1024,
        y = rand() * 1024,
        r = 0.6 + rand() * 1.9;
      const light = 43 + rand() * 12;
      ctx.fillStyle = `hsl(33, ${29 + rand() * 15}%, ${light}%)`;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3,
          rr = r * (0.6 + rand() * 0.5);
        const px = x + Math.cos(a) * rr,
          py = y + Math.sin(a) * rr;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(61,39,19,.22)";
    for (let i = 0; i < 12000; i++)
      ctx.fillRect(rand() * 1024, rand() * 1024, 0.5 + rand(), 0.5 + rand());
  });
}
function paperGeometry(w: number, h: number, index: number) {
  const geometry = new THREE.PlaneGeometry(w, h, 24, 28),
    p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2),
      v = (h / 2 - p.getY(i)) / h;
    const bottom = Math.pow(v, 5),
      corner = Math.pow(Math.abs(x), 6);
    const curl = bottom * (4 + corner * (index % 2 ? 12 : 8));
    const ripple = Math.sin(x * 3 + index) * 1.1 * v * v;
    p.setZ(i, 1 + curl + ripple + 1.3 * x * x);
  }
  geometry.computeVertexNormals();
  return geometry;
}
function noteTexture(note: Note, index: number) {
  const rand = randomSource();
  return canvasTexture(768, (ctx) => {
    ctx.fillStyle = index % 3 === 1 ? "#f2eddf" : "#f8f4e9";
    ctx.fillRect(0, 0, 768, 768);
    for (let i = 0; i < 18000; i++) {
      ctx.fillStyle = `rgba(98,80,56,${rand() * 0.025})`;
      ctx.fillRect(rand() * 768, rand() * 768, 1, 1);
    }
    ctx.fillStyle = "#8b6550";
    ctx.font = "500 24px Arial";
    ctx.fillText(note.subtitle, 48, 100);
    ctx.fillStyle = "#293b35";
    ctx.font = "48px Georgia";
    ctx.fillText(note.title, 48, 165, 672);
    ctx.fillStyle = "#c6b9a2";
    ctx.fillRect(48, 194, 672, 1.5);
    ctx.fillStyle = "#455049";
    ctx.font = "31px Arial";
    let y = 248;
    for (const paragraph of note.body.split(/\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (line && ctx.measureText(line + word).width > 668) {
          ctx.fillText(line.trim(), 48, y);
          y += 39;
          line = "";
        }
        line += word + " ";
      }
      if (line) {
        ctx.fillText(line.trim(), 48, y);
        y += 45;
      }
    }
  });
}
function pushpin(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  color: number,
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.x = Math.PI / 2;
  parent.add(group);
  const steel = mat(0xb6b8b7, 0.24);
  steel.metalness = 0.85;
  add(group, new THREE.CylinderGeometry(1.35, 1.35, 14, 12), steel, 0, -4, 0);
  const plastic = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color).convertSRGBToLinear(),
    roughness: 0.25,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
  });
  const profile = [
    [0, 0],
    [8, 0],
    [10, 2],
    [9.5, 4],
    [5.2, 6],
    [4.4, 11],
    [6, 15],
    [10, 16],
    [10.5, 18],
    [9, 20],
    [0, 20],
  ];
  add(
    group,
    new THREE.LatheGeometry(
      profile.map(([r, h]) => new THREE.Vector2(r, h)),
      32,
    ),
    plastic,
  );
}
export function createPinboard(contents: Note[]) {
  const board = new THREE.Group();
  board.name = "Cork pinboard — oak frame and paper notes";
  const wood = mat(0xbd9467, 0.48);
  wood.map = canvasTexture(512, (ctx) => {
    ctx.fillStyle = "#f1ddbd";
    ctx.fillRect(0, 0, 512, 512);
    const rand = randomSource();
    for (let i = 0; i < 900; i++) {
      const y = rand() * 512;
      ctx.strokeStyle = `rgba(108,75,39,${0.02 + rand() * 0.1})`;
      ctx.lineWidth = 0.3 + rand();
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const yy = y + Math.sin(x / 100 + i) * 1.8;
        if (!x) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  });
  const backing = mat(0x85684a);
  add(board, new THREE.BoxGeometry(2338, 1488, 26), backing, 0, 0, -8);
  const cork = mat(0xffffff, 0.98);
  cork.map = corkTexture();
  cork.bumpMap = cork.map;
  cork.bumpScale = 0.45;
  add(board, new THREE.BoxGeometry(2254, 1404, 16), cork, 0, 0, 13);
  // Four actual mitered moldings, rather than a solid slab behind the cork.
  function rail(length: number, x: number, y: number, rotation: number) {
    const half = length / 2,
      thickness = 48;
    const shape = new THREE.Shape();
    shape.moveTo(-half, -thickness / 2);
    shape.lineTo(half, -thickness / 2);
    shape.lineTo(half - thickness, thickness / 2);
    shape.lineTo(-half + thickness, thickness / 2);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 38,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 2,
      bevelThickness: 2,
    });
    const p = geo.attributes.position,
      uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++)
      uv.setXY(i, p.getX(i) / length + 0.5, p.getY(i) / 48 + 0.5);
    const piece = add(board, geo, wood, x, y, -12);
    piece.rotation.z = rotation;
  }
  rail(2346, 0, -725, 0);
  rail(2346, 0, 725, Math.PI);
  rail(1496, -1150, 0, -Math.PI / 2);
  rail(1496, 1150, 0, Math.PI / 2);
  const notes: THREE.Group[] = [];
  const pins = [0x496357, 0x9b5841, 0xc3a66d, 0x657984, 0x526451, 0xaa8060];
  const rotations = [-0.032, 0.018, -0.014, 0.025, -0.024, 0.035];
  contents.slice(0, 6).forEach((content, i) => {
    const x = -715 + (i % 3) * 715,
      y = i < 3 ? 337 : -327,
      w = 505,
      h = [494, 505, 488, 510, 496, 500][i];
    const note = new THREE.Group();
    note.position.set(x, y, 23);
    note.rotation.z = rotations[i];
    board.add(note);
    notes.push(note);
    const geometry = paperGeometry(w, h, i);
    const front = mat(0xffffff, 0.96);
    front.map = noteTexture(content, i);
    add(note, geometry, front);
    const back = mat(i % 3 === 1 ? 0xf2eddf : 0xf8f4e9, 0.96);
    back.side = THREE.BackSide;
    const reverse = add(note, geometry, back, 0, 0, -0.65);
    reverse.castShadow = false;
    // The pin pierces the sheet near its upper edge, and remains on the board during pickup.
    const pinY = h / 2 - 31;
    pushpin(
      board,
      x - Math.sin(rotations[i]) * pinY,
      y + Math.cos(rotations[i]) * pinY,
      25,
      pins[i],
    );
  });
  // A couple of spare tacks give the cork a recognizable real-world scale.
  pushpin(board, 1005, -594, 23, pins[1]);
  pushpin(board, 1042, -563, 23, pins[0]);
  return { board, notes };
}
