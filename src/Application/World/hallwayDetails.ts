import * as THREE from "three";
import { assetLoadingManager } from "../Utils/assetLoading";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import PersonalDesk from "./PersonalDesk";

// Shared, local PBR maps; no runtime dependency on an asset service.
export function hallwayMaterials(desk: PersonalDesk) {
  const loader = new THREE.TextureLoader(assetLoadingManager);
  const texture = (id: string, kind: string, repeat = 1) => {
    const t = loader.load(`/models/hallway/${id}_${kind}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    // Sample a single stone interior, excluding the photographed grout lines.
    if (id === "marble_01") {
      t.repeat.set(0.27, 0.19);
      t.offset.set(0.37, 0.34);
    }
    t.anisotropy = Math.min(
      8,
      desk.app.renderer.instance.capabilities.getMaxAnisotropy(),
    );
    if (kind === "Diffuse") t.encoding = THREE.sRGBEncoding;
    return t;
  };
  const pmrem = new THREE.PMREMGenerator(desk.app.renderer.instance);
  const studio = new RoomEnvironment();
  const environment = pmrem.fromScene(studio).texture;
  studio.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    if (m.material)
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) =>
        x.dispose(),
      );
  });
  pmrem.dispose();
  const brass = desk.material(0xbda06a, 0.87);
  brass.roughness = 0.28;
  brass.envMap = environment;
  brass.envMapIntensity = 0.75;
  const paint = (color: number) => {
    const m = desk.material(color);
    m.roughness = 0.55;
    m.normalMap = texture("painted_plaster_wall", "nor_gl", 2);
    m.normalScale.set(0.07, 0.07);
    m.envMap = environment;
    m.envMapIntensity = 0.035;
    return m;
  };
  const plaster = paint(0xd2cbbf);
  plaster.roughness = 0.95;
  plaster.normalScale.set(0.18, 0.18);
  // Fine aggregate terrazzo, with no photographed grout baked into the surface.
  const surface = document.createElement("canvas");
  surface.width = surface.height = 512;
  const ctx = surface.getContext("2d")!;
  ctx.fillStyle = "#a5a39a";
  ctx.fillRect(0, 0, 512, 512);
  let seed = 1947;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 18000; i++) {
    const x = rand() * 512,
      y = rand() * 512,
      r = 0.3 + rand() * 1.8;
    ctx.fillStyle = ["#d1cec4", "#bab8ae", "#898b85", "#777d78"][i % 4];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + r, y - r * 0.7);
    ctx.lineTo(x + r * 1.4, y + r * 0.5);
    ctx.lineTo(x, y + r);
    ctx.fill();
  }
  const aggregate = new THREE.CanvasTexture(surface);
  aggregate.encoding = THREE.sRGBEncoding;
  aggregate.anisotropy = 8;
  const stone = new THREE.MeshStandardMaterial({
    map: aggregate,
    roughness: 0.82,
    envMap: environment,
    envMapIntensity: 0.04,
  });
  const materials = {
    wood: paint(0x53615a),
    neighborDoor: paint(0x77756b),
    brass,
    plaster,
    stone,
    panel: paint(0x53605b),
    trim: paint(0x354740),
    frame: paint(0xc8bca5),
  };
  Object.values(materials).forEach(corridorLighting);
  return materials;
}
export type HallwayMaterials = ReturnType<typeof hallwayMaterials>;

// Slotted fasteners sit proud of a countersunk circular seat.
export function screw(
  desk: PersonalDesk,
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  brass: THREE.MeshStandardMaterial,
  r = 10,
) {
  const head = desk.cylinder(r, 4, x, y, z, brass, r, parent);
  head.rotation.x = Math.PI / 2;
  desk.box(
    r * 1.35,
    2.5,
    1,
    x,
    y,
    z + 2.5,
    desk.material(0x42392b),
    0.5,
    parent,
  );
}
export function lever(
  desk: PersonalDesk,
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  brass: THREE.MeshStandardMaterial,
) {
  desk.box(115, 335, 24, x, y, z, brass, 14, parent);
  for (const dy of [-137, 137]) screw(desk, parent, x, y + dy, z + 14, brass);
  const grip = new THREE.Group();
  grip.name = "Operable door lever";
  grip.position.set(x, y + 48, z + 55);
  parent.add(grip);
  const neck = desk.cylinder(37, 90, 0, 0, 0, brass, 32, grip);
  neck.rotation.x = Math.PI / 2;
  desk.line(
    [
      [0, 0, 35],
      [-45, 0, 70],
      [-155, 0, 75],
      [-240, 7, 60],
    ],
    23,
    brass,
    grip,
  );
  const lock = desk.cylinder(27, 7, x, y - 75, z + 17, brass, 27, parent);
  lock.rotation.x = Math.PI / 2;
  desk.box(5, 26, 2, x, y - 75, z + 22, desk.material(0x302a22), 1, parent);
  return grip;
}
export function hingeDetail(
  desk: PersonalDesk,
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  brass: THREE.MeshStandardMaterial,
) {
  desk.box(82, 165, 9, x + 27, y, z, brass, 3, parent);
  for (let i = 0; i < 5; i++)
    desk.cylinder(18, 31, x, y - 64 + i * 32, z + 13, brass, 18, parent);
  for (const dy of [-53, 53])
    screw(desk, parent, x + 45, y + dy, z + 7, brass, 8);
}
// Three successive beads form a stepped panel profile instead of a flat outline.
export function panelMould(
  desk: PersonalDesk,
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  m: THREE.MeshStandardMaterial,
) {
  for (let layer = 0; layer < 3; layer++) {
    const inset = layer * 14,
      width = w - inset * 2,
      height = h - inset * 2,
      bead = layer === 1 ? 18 : 12;
    for (const s of [-1, 1]) {
      desk.box(
        bead,
        height,
        12,
        x + (s * (width - bead)) / 2,
        y,
        z + layer * 6,
        m,
        4,
        parent,
      );
      desk.box(
        width - bead * 2,
        bead,
        12,
        x,
        y + (s * (height - bead)) / 2,
        z + layer * 6,
        m,
        4,
        parent,
      );
    }
  }
}

/** Enclosed corridor receives only a little of the apartment's global daylight.
 * Actual local point/spot lights remain unmodified, including their shadows.
 */
export function corridorLighting(material: THREE.Material) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  material.onBeforeCompile = (shader) => {
    const lights = THREE.ShaderChunk.lights_fragment_begin
      .replace(
        "getDirectionalLightInfo( directionalLight, geometry, directLight );",
        "getDirectionalLightInfo( directionalLight, geometry, directLight ); directLight.color *= 0.035;",
      )
      .replace(
        "getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal )",
        "0.06 * getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal )",
      )
      .replace(
        "getAmbientLightIrradiance( ambientLightColor )",
        "0.06 * getAmbientLightIrradiance( ambientLightColor )",
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_begin>",
      lights,
    );
  };
  material.customProgramCacheKey = () => "enclosed-corridor-v1";
  material.needsUpdate = true;
}

/** Joinery with real recessed infill, broad stiles, and unequal panel heights. */
export function paneledDoor(
  desk: PersonalDesk,
  parent: THREE.Object3D,
  x: number,
  bottom: number,
  z: number,
  w: number,
  h: number,
  finish: THREE.MeshStandardMaterial,
) {
  const stile = w * 0.135,
    middle = h * 0.43,
    rail = 190;
  const box = (
    width: number,
    height: number,
    depth: number,
    cx: number,
    cy: number,
    cz: number,
    m = finish,
  ) => desk.box(width, height, depth, cx, cy, cz, m, 6, parent);
  box(w, h, 35, x, bottom + h / 2, z - 40);
  for (const side of [-1, 1])
    box(stile, h, 100, x + (side * (w - stile)) / 2, bottom + h / 2, z);
  box(w - 2 * stile, 200, 100, x, bottom + h - 100, z);
  box(w - 2 * stile, 250, 100, x, bottom + 125, z);
  box(w - 2 * stile, rail, 100, x, bottom + middle, z);
  const inset = finish.clone();
  inset.color.multiplyScalar(0.86);
  corridorLighting(inset);
  for (const [lo, hi] of [
    [250, middle - rail / 2],
    [middle + rail / 2, h - 200],
  ]) {
    const height = hi - lo,
      cy = bottom + (hi + lo) / 2,
      width = w - 2 * stile;
    box(width, height, 28, x, cy, z - 8, inset);
    // Beveled inner edge and a fine raised bead give a visible panel reveal.
    for (const side of [-1, 1]) {
      box(36, height, 40, x + (side * (width - 36)) / 2, cy, z + 20);
      box(width - 72, 36, 40, x, cy + (side * (height - 36)) / 2, z + 20);
      box(12, height - 46, 12, x + (side * (width - 55)) / 2, cy, z + 40);
      box(width - 55, 12, 12, x, cy + (side * (height - 55)) / 2, z + 40);
    }
  }
}
