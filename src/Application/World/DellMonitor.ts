import { assetLoadingManager } from "../Utils/assetLoading";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MONITOR as M } from "./monitorLayout";

/** Original geometry based on Dell's S3222DGM outline and product photographs.
 * The front aperture is flat so the live CSS3D desktop stays sharp to the bezel.
 */
export default class DellMonitor extends THREE.Group {
  constructor() {
    super();
    this.name = "Dell 32 inch monitor — native browser display";
    const plastic = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#292a2d").convertSRGBToLinear(),
      roughness: 0.72,
    });
    const edge = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#141517").convertSRGBToLinear(),
      roughness: 0.82,
    });
    const trim = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#36383c").convertSRGBToLinear(),
      roughness: 0.62,
    });
    const add = (
      name: string,
      g: THREE.BufferGeometry,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new THREE.Mesh(g, mat);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.add(mesh);
      return mesh;
    };
    const box = (
      name: string,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat = plastic,
    ) =>
      add(
        name,
        new RoundedBoxGeometry(w, h, d, 2, Math.min(4, h / 3, d / 3)),
        mat,
        x,
        y,
        z,
      );
    const bottom = M.top - M.height;
    const activeBottom = M.screenY - M.screenHeight / 2;
    // A single continuous rounded ring replaces the four intersecting rails.
    // Corresponding contours share the same samples, so corners cannot overlap.
    const contour = (w: number, h: number, r: number, cy: number) => {
      const points: THREE.Vector2[] = [];
      const corners = [
        [w / 2 - r, cy + h / 2 - r],
        [-w / 2 + r, cy + h / 2 - r],
        [-w / 2 + r, cy - h / 2 + r],
        [w / 2 - r, cy - h / 2 + r],
      ];
      for (let corner = 0; corner < 4; corner++) {
        const [cx, cyCorner] = corners[corner];
        const start = (corner * Math.PI) / 2;
        for (let j = 0; j <= 12; j++) {
          const angle = start + (j * Math.PI) / 24;
          points.push(
            new THREE.Vector2(
              cx + Math.cos(angle) * r,
              cyCorner + Math.sin(angle) * r,
            ),
          );
        }
        const end = points[points.length - 1];
        const [nx, ny] = corners[(corner + 1) % 4];
        const next = new THREE.Vector2(
          nx + Math.cos(start + Math.PI / 2) * r,
          ny + Math.sin(start + Math.PI / 2) * r,
        );
        for (let j = 1; j < 64; j++)
          points.push(end.clone().lerp(next, j / 64));
      }
      return points;
    };
    const outside = contour(M.width, M.height, 7, (M.top + bottom) / 2);
    const inside = contour(M.screenWidth, M.screenHeight, 1.5, M.screenY);
    const positions: number[] = [],
      indices: number[] = [];
    const n = outside.length;
    for (const [points, front] of [
      [outside, true],
      [inside, true],
      [outside, false],
      [inside, false],
    ] as const)
      for (const p of points) positions.push(p.x, p.y, front ? 2 : -25);
    const strip = (a: number, b: number, reverse = false) => {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const face = [
          a * n + i,
          a * n + j,
          b * n + i,
          a * n + j,
          b * n + j,
          b * n + i,
        ];
        indices.push(...(reverse ? face.reverse() : face));
      }
    };
    strip(0, 1);
    strip(2, 0);
    strip(1, 3);
    strip(3, 2);
    const bezel = new THREE.BufferGeometry();
    bezel.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    bezel.setIndex(indices);
    // Keep the broad bezel face flat; sharing normals across the return would
    // make the lower strip look inflated like a tube.
    const bezelFaces = bezel.toNonIndexed();
    bezelFaces.computeVertexNormals();
    bezel.dispose();
    add("Continuous slim rounded bezel", bezelFaces, plastic, 0, 0, M.z);
    // Keep the entire enclosure behind the flat display. The shaped rear shell
    // retains depth without crossing the browser plane near the sides.
    const centerY = (M.top + bottom) / 2;
    const rearZ = (x: number, y: number) => {
      const horizontal = Math.max(0, 1 - (x / (M.width / 2)) ** 2);
      const vertical = Math.sin(Math.PI * (y / M.height + 0.5));
      return -25 - 60 * horizontal ** 2 * vertical ** 2;
    };
    const back = new THREE.BoxGeometry(
      M.width - 14,
      M.height - 14,
      1,
      96,
      32,
      1,
    );
    const p = back.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setZ(i, p.getZ(i) > 0 ? -3 : rearZ(p.getX(i), p.getY(i)));
    back.computeVertexNormals();
    add("Shaped rear enclosure", back, plastic, 0, centerY, M.z);
    for (let row = 0; row < 18; row++) {
      const y = bottom + 40 + row * 27;
      const vent = new THREE.PlaneGeometry(850 - row * 29, 5, 32, 1);
      const vp = vent.attributes.position;
      for (let i = 0; i < vp.count; i++)
        vp.setZ(i, rearZ(vp.getX(i), y + vp.getY(i) - centerY) - 0.6);
      vent.computeVertexNormals();
      const slot = add("Rear ventilation slot", vent, edge, 0, y, M.z);
      slot.material = new THREE.MeshStandardMaterial({
        color: 0x08090a,
        roughness: 1,
        side: THREE.DoubleSide,
      });
      slot.castShadow = false;
    }
    box(
      "Height adjustment column",
      184,
      590,
      105,
      0,
      M.shelfY + 310,
      M.z - 184,
      trim,
    );
    box("Stand mounting head", 210, 200, 90, 0, M.shelfY + 560, M.z - 115);
    // Broad chamfered polygon base, matching the compact Dell gaming stand.
    const shape = new THREE.Shape();
    const pts = [
      [-285, -268],
      [285, -268],
      [320, -218],
      [280, 218],
      [220, 267],
      [-220, 267],
      [-280, 218],
      [-320, -218],
    ];
    pts.forEach(([x, z], i) => (i ? shape.lineTo(x, z) : shape.moveTo(x, z)));
    shape.closePath();
    const foot = new THREE.ExtrudeGeometry(shape, {
      depth: 22,
      bevelEnabled: true,
      bevelSize: 3,
      bevelThickness: 3,
      bevelSegments: 1,
      steps: 1,
    });
    foot.rotateX(-Math.PI / 2);
    add("Angular stand base", foot, plastic, 0, M.shelfY + 3, M.z - 95);
    // Actual Dell vector paths, including the distinctive tilted E.
    const texture = new THREE.TextureLoader(assetLoadingManager).load(
      "/branding/dell-wordmark.svg",
    );
    texture.encoding = THREE.sRGBEncoding;
    const logo = add(
      "Dell chin wordmark",
      new THREE.PlaneGeometry(66, (66 * 134.95) / 408),
      new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        roughness: 0.4,
        metalness: 0.15,
      }),
      0,
      (activeBottom + bottom) / 2,
      M.z + 2.6,
    );
    logo.castShadow = false;
    box(
      "Power indicator",
      8,
      2,
      2,
      M.width / 2 - 39,
      bottom + 10,
      M.z + 4,
      new THREE.MeshStandardMaterial({
        color: 0xd8dfed,
        emissive: 0x687888,
        emissiveIntensity: 0.2,
      }),
    );
  }
}
