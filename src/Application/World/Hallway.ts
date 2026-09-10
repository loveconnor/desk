import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import PersonalDesk from "./PersonalDesk";
import {
  HallwayMaterials,
  lever,
  hingeDetail,
  panelMould,
  paneledDoor,
  corridorLighting,
  screw,
} from "./hallwayDetails";

export default class Hallway {
  group = new THREE.Group();
  constructor(desk: PersonalDesk, materials: HallwayMaterials) {
    this.group.name = "Apartment corridor — paneling, sconces, tiled landing";
    desk.app.scene.add(this.group);
    const { plaster, panel, trim, brass, wood, stone } = materials;
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      m = panel,
    ) => desk.box(w, h, d, x, y, z, m, 5, this.group);
    // Exact clear wall bays between door casings. Each frame is closed and
    // independently inset, so no molding runs through an adjacent door.
    for (const [left, right] of [
      [-40000, -12050],
      [-10150, -7830],
      [-5270, -2450],
      [-550, 30000],
    ]) {
      const w = right - left,
        x = (left + right) / 2;
      box(w, 1820, 60, x, -1370, 16240);
      box(w, 80, 95, x, -420, 16265, trim);
      box(w, 130, 100, x, -2240, 16265, trim);
      box(w, 26, 135, x, -375, 16275, trim);
      box(w, 30, 90, x, -483, 16273, trim);
      box(w, 38, 125, x, -2160, 16277, trim);
      box(w, 35, 140, x, -2280, 16285, trim);
      const count = Math.max(1, Math.floor((w - 160) / 740));
      const panelWidth = Math.min(620, w - 180);
      const gap = (w - count * panelWidth) / (count + 1);
      for (let i = 0; i < count; i++) {
        const cx = left + gap + panelWidth / 2 + i * (panelWidth + gap);
        panelMould(desk, this.group, cx, -1370, 16283, panelWidth, 1360, trim);
      }
    }
    box(70000, 100, 95, -5000, 2660, 16280, trim);
    box(70000, 45, 145, -5000, 2725, 16295, trim);
    box(70000, 30, 190, -5000, 2760, 16310, plaster);
    box(70000, 80, 180, -5000, 2790, 16270, plaster);
    box(70000, 130, 9400, -5000, 2900, 20900, plaster);
    for (const x of [-40060, 30060]) {
      box(120, 5300, 9600, x, 300, 20900, plaster);
      box(150, 1800, 9600, x, -1370, 20900);
    }
    // Shared beveled geometry and instancing keep the full corridor inexpensive.
    const tileGeometry = new RoundedBoxGeometry(1192, 28, 1192, 1, 3);
    const tiles = new THREE.InstancedMesh(tileGeometry, stone, 8 * 59);
    tiles.name = "Warm-gray terrazzo tiles with fine grout";
    const matrix = new THREE.Matrix4();
    const tint = new THREE.Color();
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 59; col++) {
        const i = row * 59 + col;
        matrix.makeRotationY(((i % 4) * Math.PI) / 2);
        matrix.setPosition(-39400 + col * 1200, -2305, 16600 + row * 1200);
        tiles.setMatrixAt(i, matrix);
        const value = 0.94 + ((i * 37) % 7) / 100;
        tiles.setColorAt(i, tint.setRGB(value, value, value));
      }
    tiles.receiveShadow = true;
    this.group.add(tiles);
    box(70000, 10, 9400, -5000, -2324, 20450, desk.material(0x79756c));
    // Entry mat and brass doorbell.
    const matCanvas = document.createElement("canvas");
    matCanvas.width = 1024;
    matCanvas.height = 512;
    const ctx = matCanvas.getContext("2d")!;
    ctx.fillStyle = "#8e663d";
    ctx.fillRect(0, 0, 1024, 512);
    // Short interwoven strands give the surface the coarse texture of coir.
    for (let i = 0; i < 38000; i++) {
      const x = (i * 193.37) % 1024,
        y = (i * 83.71) % 512;
      ctx.strokeStyle =
        i % 3 === 0 ? "rgba(63,38,16,.26)" : "rgba(218,177,108,.42)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2 + (i % 5), y - 3);
      ctx.stroke();
    }

    // Copy the unprinted fibers for relief; lettering should not emboss the mat.
    const fiberCanvas = document.createElement("canvas");
    fiberCanvas.width = 1024;
    fiberCanvas.height = 512;
    fiberCanvas.getContext("2d")!.drawImage(matCanvas, 0, 0);
    const fiberTexture = new THREE.CanvasTexture(fiberCanvas);
    ctx.strokeStyle = "#27231e";
    ctx.lineWidth = 12;
    ctx.strokeRect(35, 35, 954, 442);
    ctx.fillStyle = "#24211c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 116px Georgia";
    ctx.fillText("WELCOME", 512, 262);
    const matTexture = new THREE.CanvasTexture(matCanvas);
    matTexture.encoding = THREE.sRGBEncoding;
    matTexture.anisotropy =
      desk.app.renderer.instance.capabilities.getMaxAnisotropy();
    box(2720, 24, 1320, -6550, -2281, 17200, desk.material(0x27251f));
    box(2690, 52, 1290, -6550, -2248, 17200, desk.material(0x795431));
    const matSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(2670, 1270),
      new THREE.MeshStandardMaterial({
        map: matTexture,
        bumpMap: fiberTexture,
        bumpScale: 7,
        roughness: 1,
      }),
    );
    matSurface.name = "Coir WELCOME mat";
    matSurface.rotation.x = -Math.PI / 2;
    matSurface.position.set(-6550, -2221, 17200);
    matSurface.receiveShadow = true;
    this.group.add(matSurface);
    box(160, 290, 26, -4900, 220, 16305, brass);
    for (const y of [107, 333])
      screw(desk, this.group, -4900, y, 16321, brass, 9);
    const bezel = desk.cylinder(
      49,
      18,
      -4900,
      220,
      16330,
      brass,
      49,
      this.group,
    );
    bezel.rotation.x = Math.PI / 2;
    const button = desk.cylinder(
      34,
      14,
      -4900,
      220,
      16343,
      desk.material(0x282923),
      34,
      this.group,
    );
    button.rotation.x = Math.PI / 2;
    for (const x of [-9100, -4000]) {
      box(195, 610, 36, x, 1040, 16298, brass);
      for (const y of [770, 1310]) screw(desk, this.group, x, y, 16320, brass);
      // Bent arm, turned socket and a fine ribbed opal-glass diffuser.
      desk.line(
        [
          [x, 850, 16320],
          [x, 850, 16410],
          [x, 900, 16480],
        ],
        26,
        brass,
        this.group,
      );
      const shade = new THREE.MeshStandardMaterial({
        color: 0xe8e2d5,
        emissive: 0xffdbac,
        emissiveIntensity: 1.7,
        roughness: 0.3,
        envMap: brass.envMap,
        envMapIntensity: 0.35,
      });
      const geometry = new THREE.CylinderGeometry(113, 113, 465, 128, 1, true);
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const angle = Math.atan2(positions.getZ(i), positions.getX(i));
        const r = 113 + Math.cos(angle * 64) * 2;
        positions.setX(i, Math.cos(angle) * r);
        positions.setZ(i, Math.sin(angle) * r);
      }
      geometry.computeVertexNormals();
      const diffuser = desk.mesh(geometry, shade, x, 1080, 16480, this.group);
      diffuser.castShadow = false;
      for (const y of [841, 1319]) {
        desk.cylinder(122, 19, x, y, 16480, brass, 122, this.group);
        desk.cylinder(
          116,
          9,
          x,
          y + (y < 1000 ? 15 : -15),
          16480,
          brass,
          116,
          this.group,
        );
      }
      const light = new THREE.PointLight(0xffdbad, 3.2, 10500, 1.5);
      light.name = "Hallway sconce illumination";
      light.position.set(x, 1080, 16610);
      light.castShadow = false;
      light.shadow.mapSize.set(512, 512);
      light.shadow.camera.near = 45;
      light.shadow.camera.far = 10500;
      light.shadow.bias = -0.0003;
      light.shadow.normalBias = 6;
      this.group.add(light);
      const contact = new THREE.SpotLight(
        0xffdbad,
        0.65,
        8500,
        Math.PI / 2.5,
        1,
        1.5,
      );
      contact.name = "Hallway sconce contact light";
      contact.position.set(x, 1080, 17180);
      contact.target.position.set(x, 850, 16200);
      contact.castShadow = true;
      contact.shadow.mapSize.set(1024, 1024);
      contact.shadow.camera.near = 50;
      contact.shadow.bias = -0.0003;
      contact.shadow.normalBias = 6;
      contact.shadow.radius = 4;
      this.group.add(contact, contact.target);
    }
    // Neighboring doors anchor the corridor's scale.
    for (const x of [-11100, -1500]) {
      // A recessed leaf sits inside three solid jambs, with a narrow reveal.
      // The casing projects beyond the leaf instead of sitting behind it.
      for (const side of [-1, 1])
        box(85, 4170, 160, x + side * 907.5, -195, 16260, trim);
      box(1730, 85, 160, x, 1847.5, 16260, trim);
      box(1730, 45, 160, x, -2257.5, 16260, trim);
      paneledDoor(
        desk,
        this.group,
        x,
        -2227,
        16250,
        1714,
        4024,
        materials.neighborDoor,
      );
      for (const y of [-1700, -200, 1350])
        hingeDetail(desk, this.group, x - 840, y, 16300, brass);
      lever(desk, this.group, x + 710, -150, 16304, brass);

      for (const side of [-1, 1])
        box(22, 4110, 25, x + side * 907.5, -195, 16352, trim);
    }
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.material)
        (Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        ).forEach(corridorLighting);
    });
    // The corridor is static. Batch repeated trim and hardware by material and
    // shadow flags; the animated main door remains in Entrance.hinge.
    const batches = new Map<string, THREE.Mesh[]>();
    for (const child of this.group.children) {
      if (
        !(child instanceof THREE.Mesh) ||
        child instanceof THREE.InstancedMesh ||
        Array.isArray(child.material)
      )
        continue;
      const key = `${child.material.uuid}:${child.castShadow}:${child.receiveShadow}`;
      const batch = batches.get(key) || [];
      batch.push(child);
      batches.set(key, batch);
    }
    for (const meshes of batches.values()) {
      if (meshes.length < 2) continue;
      const copies = meshes.map((mesh) => {
        mesh.updateMatrix();
        return mesh.geometry.clone().applyMatrix4(mesh.matrix);
      });
      const geometry = mergeBufferGeometries(copies);
      copies.forEach((g) => g.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, meshes[0].material);
      merged.name = "Batched corridor architecture";
      merged.castShadow = meshes[0].castShadow;
      merged.receiveShadow = meshes[0].receiveShadow;
      meshes.forEach((mesh) => {
        this.group.remove(mesh);
        mesh.geometry.dispose();
      });
      this.group.add(merged);
    }
  }
}
