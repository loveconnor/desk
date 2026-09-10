import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Original geometry referenced against IKEA's POÄNG photos and 68 × 83 × 100 cm dimensions.
// Model units are centimetres; the room uses 22 scene units per centimetre.
const color = (hex: number) => new THREE.Color(hex).convertSRGBToLinear();
const material = (hex: number, roughness = 0.65) =>
  new THREE.MeshStandardMaterial({ color: color(hex), roughness });

function surface(kind: "birch" | "oak" | "fabric") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const n = noise - Math.floor(noise);
      const grain = Math.sin(
        x * 0.38 + Math.sin((y * Math.PI) / 128) * 1.8 + Math.sin(x * 0.08) * 2,
      );
      const value =
        kind === "fabric"
          ? 205 + n * 32 + (x % 3 === 0 ? -22 : 0) + (y % 3 === 0 ? -15 : 0)
          : 222 + grain * 4 + n * 9;
      const i = (y * 256 + x) * 4;
      pixels.data[i] = value;
      pixels.data[i + 1] = value;
      pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
  ctx.putImageData(pixels, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  map.encoding = THREE.sRGBEncoding;
  map.repeat.set(kind === "fabric" ? 4 : 1, kind === "fabric" ? 4 : 1);
  return map;
}
function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}
function rounded(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  r: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  return mesh(parent, new RoundedBoxGeometry(w, h, d, 5, r), mat, x, y, z);
}

// Sweep a flat, gently rounded bentwood section along a side profile.
function bentwood(
  parent: THREE.Object3D,
  x: number,
  points: number[][],
  width: number,
  thickness: number,
  mat: THREE.Material,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  );
  const shape = new THREE.Shape();
  const w = width / 2,
    t = thickness / 2,
    r = 0.28;
  shape.moveTo(-w + r, -t);
  shape.lineTo(w - r, -t);
  shape.quadraticCurveTo(w, -t, w, -t + r);
  shape.lineTo(w, t - r);
  shape.quadraticCurveTo(w, t, w - r, t);
  shape.lineTo(-w + r, t);
  shape.quadraticCurveTo(-w, t, -w, t - r);
  shape.lineTo(-w, -t + r);
  shape.quadraticCurveTo(-w, -t, -w + r, -t);
  // Three's path frames put the section's X axis along world X for this YZ path.
  const geometry = new THREE.ExtrudeGeometry(shape, {
    steps: 100,
    bevelEnabled: false,
    extrudePath: curve,
    curveSegments: 5,
  });
  geometry.deleteAttribute("normal");
  const smooth = mergeVertices(geometry);
  smooth.computeVertexNormals();
  geometry.dispose();
  return mesh(parent, smooth, mat);
}
/** A sewn foam pad swept continuously around the seat/back bend.
 * The crowned cross section, quilting depressions and rolled ends are geometry,
 * so they remain soft under the room's directional lighting. */
function upholsteredPad(
  parent: THREE.Object3D,
  profile: number[][],
  width: number,
  thickness: number,
  fabric: THREE.Material,
  quilted: boolean,
) {
  const curve = new THREE.CatmullRomCurve3(
    profile.map(([y, z]) => new THREE.Vector3(0, y, z)),
    false,
    "centripetal",
  );
  const length = curve.getLength();
  const rows = quilted ? 180 : 48,
    columns = 64;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const grooves = [0.18, 0.34, 0.55, 0.7, 0.85];
  for (let row = 0; row <= rows; row++) {
    const t = row / rows,
      point = curve.getPointAt(t),
      tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(0, -tangent.z, tangent.y);
    const endDistance = Math.min(t, 1 - t) * length;
    const roll = Math.sin((Math.min(1, endDistance / 2.3) * Math.PI) / 2);
    const halfWidth = width / 2 - 1.5 * (1 - roll);
    for (let column = 0; column <= columns; column++) {
      const angle = (column / columns) * Math.PI * 2;
      const sin = Math.sin(angle),
        cos = Math.cos(angle);
      const x = halfWidth * Math.sign(sin) * Math.pow(Math.abs(sin), 0.65);
      let depth =
        (thickness / 2) *
        Math.sign(cos) *
        Math.pow(Math.abs(cos), 0.65) *
        Math.max(0.025, roll);
      if (quilted && cos > 0) {
        const edgeFade = Math.pow(Math.max(0, 1 - (x / halfWidth) ** 8), 0.5);
        let depression = 0;
        for (const seam of grooves) {
          const bend = 0.004 * Math.cos((x / 9) * Math.PI);
          depression += 0.75 * Math.exp(-(((t - seam - bend) / 0.009) ** 2));
        }
        for (const stitchX of [-9, 9]) {
          const columnFold = Math.exp(-(((x - stitchX) / 1.2) ** 2));
          depression += 0.35 * columnFold;
          for (const seam of grooves)
            depression +=
              0.65 * columnFold * Math.exp(-(((t - seam) / 0.022) ** 2));
        }
        depth += (0.65 - depression) * edgeFade * cos;
      }
      positions.push(x, point.y + normal.y * depth, point.z + normal.z * depth);
      uvs.push(column / columns, (t * length) / width);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column,
          b = a + columns + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  // Close the narrow rolled ends with fabric, including the underside.
  for (const row of [0, rows]) {
    const center = positions.length / 3,
      point = curve.getPointAt(row / rows);
    positions.push(0, point.y, point.z);
    uvs.push(0.5, row / rows);
    for (let i = 0; i < columns; i++) {
      const a = row * (columns + 1) + i;
      if (row === 0) indices.push(center, a + 1, a);
      else indices.push(center, a, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(parent, geometry, fabric);
}
export function createPoangChair() {
  const chair = new THREE.Group();
  chair.name = "POÄNG — birch frame and oatmeal cushions";
  const wood = material(0xdcc39a, 0.4);
  wood.map = surface("birch");
  wood.bumpMap = wood.map;
  wood.bumpScale = 0.035;
  const fabric = material(0xb9b09d, 0.96);
  fabric.map = surface("fabric");
  fabric.bumpMap = fabric.map;
  fabric.bumpScale = 0.025;
  const hardware = material(0x777671, 0.35);
  hardware.metalness = 0.8;
  for (const x of [-31, 31]) {
    // Rearward floor runners turn up at the front, then flow back into the armrests.
    bentwood(
      chair,
      x,
      [
        [1.7, -29],
        [1.7, 16],
        [2.7, 27],
        [8, 32],
        [36, 33],
        [54, 30],
        [58, 24],
        [60, 0],
        [64, -20],
        [70, -26],
      ],
      5.4,
      2.5,
      wood,
    );
    bentwood(
      chair,
      x * 0.89,
      [
        [39, 33],
        [37, 14],
        [33, -10],
        [36, -22],
        [49, -26],
        [67, -35],
        [83, -43],
        [97, -44],
      ],
      3.3,
      2.3,
      wood,
    );
    for (const [y, z] of [
      [38, 29],
      [62, -18],
    ]) {
      const screw = mesh(
        chair,
        new THREE.CylinderGeometry(0.65, 0.65, 0.18, 12),
        hardware,
        x + Math.sign(x) * 2.76,
        y,
        z,
      );
      screw.rotation.z = Math.PI / 2;
    }
  }
  for (const [y, z] of [
    [2, -27],
    [37, 27],
    [34, -16],
    [65, -35],
    [94, -44],
  ]) {
    rounded(chair, 60, 3.8, 2.4, 0.5, wood, 0, y, z);
  }
  // A single Gunnared-style quilted pad follows the supporting seat and back rails.
  upholsteredPad(
    chair,
    [
      [40, 35],
      [39, 22],
      [37, 2],
      [37, -13],
      [41, -21],
      [51, -25],
      [68, -34],
      [83, -41],
      [96, -43],
    ],
    55,
    6.5,
    fabric,
    true,
  );
  // The full-width neck pillow has a softly crowned face and rolled perimeter.
  upholsteredPad(
    chair,
    [
      [80.5, -35.5],
      [86, -36],
      [92, -37],
      [98, -38],
    ],
    54,
    9,
    fabric,
    false,
  );
  chair.scale.setScalar(22);
  return chair;
}

export function createReadingTable() {
  const table = new THREE.Group();
  table.name = "Oak side table — beveled top and cast pedestal";
  const oak = material(0xb98a58, 0.43);
  oak.map = surface("oak");
  oak.bumpMap = oak.map;
  oak.bumpScale = 0.035;
  const metal = material(0x303432, 0.42);
  metal.metalness = 0.65;
  function lathe(profile: number[][], mat: THREE.Material) {
    const geometry = new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      80,
    );
    if (mat === oak) {
      const position = geometry.attributes.position,
        uv = geometry.attributes.uv;
      for (let i = 0; i < position.count; i++)
        uv.setXY(i, position.getX(i) / 36 + 0.5, position.getZ(i) / 36 + 0.5);
    }
    return mesh(table, geometry, mat);
  }
  lathe(
    [
      [0, 0.1],
      [10.8, 0.1],
      [12.1, 0.35],
      [12.5, 0.7],
      [12.4, 1.1],
      [11.6, 1.5],
      [5, 2],
      [3.4, 2.8],
      [2.2, 4],
      [1.75, 6],
      [1.75, 39],
      [2.1, 40.5],
      [6, 41],
      [0, 41],
    ],
    metal,
  );
  lathe(
    [
      [0, 41],
      [16.9, 41],
      [17.8, 41.25],
      [18.2, 41.8],
      [18.2, 43],
      [17.9, 43.6],
      [17.3, 43.8],
      [0, 43.8],
    ],
    oak,
  );
  // Paper block between separate book covers, with a slightly offset top cover.
  const cover = material(0x344941),
    paper = material(0xe5dfcd);
  rounded(table, 17.2, 0.35, 12.4, 0.12, cover, -3, 44, -2.7);
  rounded(table, 16.6, 1.2, 11.8, 0.12, paper, -3, 44.75, -2.7);
  rounded(table, 17.2, 0.35, 12.4, 0.12, cover, -3, 45.5, -2.7);
  const ceramic = material(0xe9e3d3, 0.23);
  const cup = new THREE.Group();
  cup.position.set(9, 43.8, 6.5);
  table.add(cup);
  mesh(
    cup,
    new THREE.LatheGeometry(
      [
        [0, 0],
        [2.3, 0],
        [2.65, 0.3],
        [2.9, 5.4],
        [2.8, 5.7],
        [2.5, 5.7],
        [2.45, 5.35],
        [2.2, 0.6],
        [0, 0.6],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      48,
    ),
    ceramic,
  );
  const handle = mesh(
    cup,
    new THREE.TorusGeometry(1.7, 0.4, 10, 32),
    ceramic,
    3.15,
    3,
    0,
  );
  handle.scale.x = 0.8;
  const coffee = material(0x362014, 0.22);
  mesh(
    cup,
    new THREE.CylinderGeometry(2.43, 2.43, 0.06, 40),
    coffee,
    0,
    4.8,
    0,
  );
  table.scale.setScalar(22);
  return table;
}
