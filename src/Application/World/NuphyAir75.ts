import * as THREE from "three";
import { AIR75_SIZE, air75Keys } from "../../keyboard/Air75Layout";
import { keyLegendAtlas } from "../../keyboard/KeyLegends";

/** Original Air75 with COAST Twilight keycaps. Geometry is authored in mm.
 * Source images/dimension provenance: docs/nuphy-air75.md.
 */
export default class NuphyAir75 extends THREE.Group {
  keys = new Map<string, THREE.Group>();
  constructor(renderer: THREE.WebGLRenderer) {
    super();
    this.name = "NuPhy Air75 — original, COAST Twilight";
    const { width, depth, pitch } = AIR75_SIZE;
    const slope = (z: number) => 5 * (0.5 - z / depth);
    const material = (color: number, roughness = 0.7, metalness = 0) =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).convertSRGBToLinear(),
        roughness,
        metalness,
      });
    const shell = material(0x596066, 0.48);
    const aluminum = material(0x73797c, 0.43, 0.65);
    const recess = material(0x20282a, 0.9);
    const colors = {
      alpha: material(0x85888a),
      modifier: material(0x535e65),
      teal: material(0x40bba9),
      orange: material(0xed683c),
      yellow: material(0xedbb35),
    };
    const add = (
      name: string,
      geometry: THREE.BufferGeometry,
      mat: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      parent: THREE.Object3D = this,
    ) => {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const slab = (w: number, d: number, h: number, r: number) => {
      const s = new THREE.Shape(),
        x = -w / 2,
        y = -d / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + d - r);
      s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
      s.lineTo(x + r, y + d);
      s.quadraticCurveTo(x, y + d, x, y + d - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      const g = new THREE.ExtrudeGeometry(s, {
        depth: h,
        bevelEnabled: false,
        curveSegments: 8,
      });
      g.rotateX(-Math.PI / 2);
      return g;
    };
    const wedge = (
      w: number,
      d: number,
      bottom: number,
      top: number,
      radius: number,
      slopedBottom = false,
    ) => {
      const g = slab(w, d, 1, radius),
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const rise = slope(p.getZ(i));
        const low = bottom + (slopedBottom ? rise : 0);
        p.setY(i, low + p.getY(i) * (top + rise - low));
      }
      g.computeVertexNormals();
      return g;
    };
    add(
      "Frosted grey ABS lower shell",
      wedge(width - 0.6, depth - 0.6, 1.5, 7, 5.8),
      shell,
    );
    add(
      "Reverse-stamped aluminum frame",
      wedge(width, depth, 7.15, 10, 6, true),
      aluminum,
    );
    add(
      "Recessed switch bed",
      wedge(305.8, 115.8, 9.8, 10.1, 3.3, true),
      recess,
    );
    for (const x of [-107, 107])
      for (const z of [-51, 51])
        add(
          "Low-profile silicone AirFoot",
          slab(42, 5.5, 1.5, 2),
          material(0x446e71),
          x,
          0,
          z,
        );
    // Underbody metal identity plate and recessed fasteners.
    add(
      "Stainless underside nameplate",
      slab(102, 43, 0.15, 3),
      material(0xa0a6aa, 0.28, 0.8),
      0,
      1.3,
      0,
    );
    for (const x of [-141, 141])
      for (const z of [-52, 52]) {
        const screw = new THREE.CylinderGeometry(1.15, 1.15, 0.2, 10);
        add("Underside screw", screw, recess, x, 1.35, z);
      }
    const led = material(0x7cdacc, 0.4);
    led.emissive = new THREE.Color(0x39bda8).convertSRGBToLinear();
    led.emissiveIntensity = 0.65;
    for (const x of [-154.3, 154.3]) {
      add(
        "Sidelight dark inset",
        slab(2.8, 19, 0.2, 1.2),
        recess,
        x,
        10.1 + slope(-47.6),
        -47.6,
      );
      const bar = add(
        "RGB side indicator — soft mint",
        slab(1.3, 16.8, 0.25, 0.6),
        led,
        x,
        10.35 + slope(-47.6),
        -47.6,
      );
      bar.castShadow = false;
    }
    // Rear USB-C socket, OS selector, and wired/off/wireless switch.
    add(
      "USB-C metal surround",
      new THREE.BoxGeometry(9.2, 3.6, 0.6),
      aluminum,
      96,
      10,
      -depth / 2 - 0.1,
    );
    add(
      "USB-C dark opening",
      new THREE.BoxGeometry(7.8, 2.4, 0.7),
      recess,
      96,
      10,
      -depth / 2 - 0.2,
    );
    for (const x of [116, 139]) {
      add(
        "Rear mode switch recess",
        new THREE.BoxGeometry(12, 3.4, 0.5),
        recess,
        x,
        10,
        -depth / 2,
      );
      add(
        "Rear mode switch slider",
        new THREE.BoxGeometry(4.2, 2.8, 1),
        shell,
        x - 2,
        10,
        -depth / 2 - 0.3,
      );
    }
    const legends = keyLegendAtlas(renderer);
    const geometryCache = new Map<number, THREE.BufferGeometry>();
    for (const key of air75Keys) {
      const w = key.units * pitch - 1.1,
        d = pitch - 1.1;
      const z = (key.row - 2.5) * pitch;
      const group = new THREE.Group();
      group.name = `Keycap ${key.code}`;
      group.position.set(key.x * pitch, 11.4 + slope(z), z);
      group.userData.restY = group.position.y;
      group.userData.travel = 3.2;
      this.add(group);
      // The wide spacebar is convex; the other COAST caps have a spherical dish.
      const heightAt = (x: number, z: number) =>
        key.code === "Space"
          ? 4.6 - 0.2 * (z / (d / 2)) ** 2
          : 4.6 -
            0.48 * Math.max(0, 1 - (x / (w / 2)) ** 2 - (z / (d / 2)) ** 2);
      let geometry = geometryCache.get(key.units);
      if (!geometry) {
        geometry = keycapGeometry(w, d, heightAt);
        geometryCache.set(key.units, geometry);
      }
      add(
        `${key.code} sculpted PBT cap`,
        geometry,
        colors[key.tone],
        0,
        0,
        0,
        group,
      );
      if (key.code !== "Space") group.add(legends(key.code, w, heightAt));
      if (["KeyF", "KeyJ"].includes(key.code))
        add(
          "Tactile homing bar",
          slab(4, 0.5, 0.15, 0.2),
          colors[key.tone],
          0,
          heightAt(0, 6),
          6,
          group,
        );
      this.keys.set(key.code, group);
    }
  }
}

/** Rounded, tapered skirt and a continuous dished top, shared by equal key sizes. */
function keycapGeometry(
  w: number,
  d: number,
  heightAt: (x: number, z: number) => number,
) {
  const vertices: number[] = [],
    indices: number[] = [];
  const segments = 8,
    ringSize = 4 * (segments + 1);
  const ring = (
    width: number,
    depth: number,
    radius: number,
    height: number | ((x: number, z: number) => number),
  ) => {
    for (let corner = 0; corner < 4; corner++) {
      const cx = (corner === 0 || corner === 3 ? 1 : -1) * (width / 2 - radius);
      const cz = (corner < 2 ? 1 : -1) * (depth / 2 - radius);
      for (let step = 0; step <= segments; step++) {
        const a = ((corner + step / segments) * Math.PI) / 2;
        const x = cx + Math.cos(a) * radius,
          z = cz + Math.sin(a) * radius;
        vertices.push(x, typeof height === "number" ? height : height(x, z), z);
      }
    }
  };
  ring(w - 0.4, d - 0.4, 2.5, 0);
  ring(w, d, 2.8, 0.65);
  ring(w - 1.1, d - 1.1, 3.6, 3.6);
  ring(w - 2, d - 2, 3.8, heightAt);
  for (const t of [0.8, 0.6, 0.4, 0.2, 0.02])
    ring((w - 2) * t, (d - 2) * t, 3.8 * t, heightAt);
  const rings = vertices.length / 3 / ringSize;
  for (let r = 0; r < rings - 1; r++)
    for (let i = 0; i < ringSize; i++) {
      const a = r * ringSize + i,
        b = r * ringSize + ((i + 1) % ringSize);
      const c = a + ringSize,
        e = b + ringSize;
      indices.push(a, c, b, b, c, e);
    }
  const center = vertices.length / 3;
  vertices.push(0, heightAt(0, 0), 0);
  for (let i = 0; i < ringSize; i++)
    indices.push(
      (rings - 1) * ringSize + i,
      center,
      (rings - 1) * ringSize + ((i + 1) % ringSize),
    );
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
