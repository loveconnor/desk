import { assetLoadingManager } from "../Utils/assetLoading";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** One complete label image, mapped once around the circumference. */
function canLabel() {
  const texture = new THREE.TextureLoader(assetLoadingManager).load(
    "/room/monster/complete-wrap.jpg",
  );
  texture.encoding = THREE.sRGBEncoding;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  // Put the main logo (22% across the complete label) at the front of the can.
  texture.offset.x = -0.28;
  return texture;
}

export function createRecycling(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const envMap = pmrem.fromScene(environment, 0.04).texture;
  environment.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    if (mesh.material)
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material])
        material.dispose();
  });
  pmrem.dispose();
  const silver = new THREE.MeshStandardMaterial({
    color: 0xc5c9ca,
    metalness: 1,
    roughness: 0.29,
    envMap,
    envMapIntensity: 0.7,
  });
  const ink = new THREE.MeshStandardMaterial({
    map: canLabel(),
    metalness: 0.38,
    roughness: 0.4,
    envMap,
    envMapIntensity: 0.45,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x080a08,
    roughness: 0.75,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0x7c887f,
    metalness: 0.45,
    roughness: 0.48,
    envMap,
    envMapIntensity: 0.4,
  });
  const mesh = (
    parent: THREE.Group,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const ring = (
    parent: THREE.Group,
    r: number,
    t: number,
    y: number,
    mat = silver,
  ) => {
    const m = mesh(parent, new THREE.TorusGeometry(r, t, 12, 96), mat, 0, y);
    m.rotation.x = Math.PI / 2;
    return m;
  };
  const can = (index: number) => {
    const group = new THREE.Group();
    group.name = "Monster can";
    const profile = [
      [-114, 36],
      [-111, 39],
      [-106, 42],
      [-101, 44],
      [-96, 45],
      [91, 45],
      [98, 44],
      [104, 41],
      [108, 38],
      [112, 38],
    ];
    const geometry = new THREE.LatheGeometry(
      profile.map(([y, r]) => new THREE.Vector2(r, y)),
      96,
    );
    const uv = geometry.getAttribute("uv");
    const pos = geometry.getAttribute("position");
    for (let i = 0; i < uv.count; i++)
      uv.setY(i, THREE.MathUtils.clamp((pos.getY(i) + 101) / 199, 0, 1));
    // Small smooth dents on discarded copies, without distorting the printed design globally.
    if (index > 0)
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i),
          x = pos.getX(i),
          z = pos.getZ(i);
        const angle = Math.atan2(x, z);
        const delta = Math.atan2(
          Math.sin(angle - index * 1.7),
          Math.cos(angle - index * 1.7),
        );
        const dent =
          1 -
          0.075 *
            Math.exp(
              -Math.pow(delta / 0.42, 2) - Math.pow((y + index * 7) / 33, 2),
            );
        pos.setXYZ(i, x * dent, y, z * dent);
      }
    geometry.computeVertexNormals();
    mesh(group, geometry, ink).rotation.y = Math.PI;
    for (const y of [-113, 112]) ring(group, 38, 1.6, y);
    // Recessed lid, scored drinking aperture, raised tab and rivet.
    mesh(group, new THREE.CylinderGeometry(37, 37, 1.2, 96), silver, 0, 110.4);
    ring(group, 32, 0.55, 111.1);
    const opening = mesh(
      group,
      new THREE.CircleGeometry(10.5, 48),
      dark,
      0,
      111.2,
      -15,
    );
    opening.rotation.x = -Math.PI / 2;
    opening.scale.set(0.78, 1.25, 1);
    const tabShape = new THREE.Shape();
    tabShape.absellipse(0, 0, 7, 13, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 3, 4, 6, 0, Math.PI * 2, true, 0);
    tabShape.holes.push(hole);
    const tab = mesh(
      group,
      new THREE.ExtrudeGeometry(tabShape, {
        depth: 1,
        bevelEnabled: true,
        bevelSize: 0.5,
        bevelThickness: 0.4,
        bevelSegments: 2,
        steps: 1,
      }),
      silver,
      0,
      113,
      0,
    );
    tab.rotation.x = -Math.PI / 2;
    mesh(
      group,
      new THREE.CylinderGeometry(2.6, 2.6, 1.8, 24),
      silver,
      0,
      114,
      5,
    );
    const bottom = [
      [-114, 36],
      [-111, 34],
      [-107, 28],
      [-106, 0],
    ].map(([y, r]) => new THREE.Vector2(r, y));
    mesh(group, new THREE.LatheGeometry(bottom, 96), silver);
    return group;
  };
  const bin = new THREE.Group();
  bin.name = "Recycling bin";
  // Closed cross section creates a real wall thickness and recessed interior floor.
  const section = [
    [0, 7],
    [219, 7],
    [226, 13],
    [267, 490],
    [268, 502],
    [264, 510],
    [257, 509],
    [254, 501],
    [255, 491],
    [216, 24],
    [0, 24],
  ];
  const shell = new THREE.LatheGeometry(
    section.map(([r, y]) => new THREE.Vector2(r, y)),
    128,
  );
  const interior = new THREE.MeshStandardMaterial({
    color: 0x30382f,
    roughness: 0.88,
  });
  // One continuous solid: interior and exterior share a rim, with no overlapping liner.
  for (let segment = 0; segment < 128; segment++) {
    for (let edge = 0; edge < section.length - 1; edge++) {
      shell.addGroup(
        (segment * (section.length - 1) + edge) * 6,
        6,
        edge >= 6 ? 1 : 0,
      );
    }
  }
  const body = new THREE.Mesh(shell, [metal, interior]);
  body.castShadow = true;
  // Coarse room shadow maps cannot resolve the thin rim and inner wall separately.
  // The interior material supplies cavity shading without self-shadow streaks.
  body.receiveShadow = false;
  bin.add(body);
  ring(bin, 261, 6, 504, metal).receiveShadow = false;
  ring(bin, 225, 4, 14, metal).receiveShadow = false;
  const reflected = [silver, ink, metal];
  const reflectionLevels = reflected.map(material => material.envMapIntensity);
  return { bin, can, setLighting: (level: number) => {
    reflected.forEach((material, i) => {
      material.envMapIntensity = reflectionLevels[i] * THREE.MathUtils.clamp(level, 0, 1);
    });
  } };
}
