import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import Hallway from "./Hallway";
import PersonalDesk from "./PersonalDesk";
import {
  hallwayMaterials,
  lever,
  hingeDetail,
  paneledDoor,
  corridorLighting,
  screw,
} from "./hallwayDetails";

export default class Entrance {
  hinge = new THREE.Group();
  private handle: THREE.Group;
  constructor(private desk: PersonalDesk) {
    const materials = hallwayMaterials(desk);
    const { frame, plaster: wall, wood, brass } = materials;
    const z = 16135;
    // One uninterrupted plaster surface, with the opening cut into its outline.
    // Separate rounded boxes left bright vertical seams above the lintel.
    const outline = new THREE.Shape();
    outline.moveTo(-40000, -2330);
    for (const [x, y] of [
      [-7700, -2330],
      [-7700, 2000],
      [-5400, 2000],
      [-5400, -2330],
      [30000, -2330],
      [30000, 5500],
      [-40000, 5500],
    ])
      outline.lineTo(x, y);
    outline.closePath();
    const wallGeometry = new THREE.ExtrudeGeometry(outline, {
      depth: 150,
      bevelEnabled: false,
    });
    const uv = wallGeometry.attributes.uv;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, uv.getX(i) / 4000, uv.getY(i) / 4000);
    const entranceWall = desk.mesh(wallGeometry, wall, 0, 0, z - 75);
    entranceWall.name = "Continuous entry plaster around door opening";
    for (const x of [-7750, -5350])
      desk.box(160, 4370, 250, x, -145, z, frame, 12);
    desk.box(2560, 160, 250, -6550, 2080, z, frame, 12);
    desk.box(2450, 60, 330, -6550, -2290, z, brass, 8);
    // A small landing outside the doorway, without a floating floor edge.
    desk.box(70000, 90, 9400, -5000, -2365, 20450, desk.material(0xbfa484), 1);
    this.hinge.position.set(-7700, -2310, z);
    desk.app.scene.add(this.hinge);
    paneledDoor(desk, this.hinge, 1150, 0, 0, 2300, 4290, wood);
    this.handle = lever(desk, this.hinge, 2125, 2100, 66, brass);
    for (const y of [650, 2145, 3660])
      hingeDetail(desk, this.hinge, 12, y, 66, brass);
    for (const x of [-7750, -5350]) {
      desk.box(35, 4310, 35, x, -145, z + 141, frame, 6);
      desk.box(175, 210, 285, x, -2195, z, frame, 8);
    }
    desk.box(2500, 35, 35, -6550, 2080, z + 141, frame, 6);
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#bca16e";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#283930";
    ctx.textAlign = "center";
    ctx.font = "bold 120px Georgia";
    ctx.textBaseline = "middle";
    ctx.fillText("Connor Love", 512, 134);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy =
      desk.app.renderer.instance.capabilities.getMaxAnisotropy();
    desk.box(1180, 320, 38, 1150, 3220, 25, brass, 12, this.hinge);
    const plaque = desk.mesh(
      new THREE.PlaneGeometry(1120, 280),
      new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.65,
        roughness: 0.35,
        envMap: brass.envMap,
        envMapIntensity: 0.6,
      }),
      1150,
      3220,
      50,
      this.hinge,
    );
    plaque.castShadow = false;
    for (const x of [610, 1690])
      screw(desk, this.hinge, x, 3220, 53, brass, 13);
    this.hinge.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.material)
        (Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        ).forEach(corridorLighting);
    });
    new Hallway(desk, materials);
    desk.app.renderer.instance.shadowMap.needsUpdate = true;
  }
  open() {
    document.dispatchEvent(new Event("doorOpening"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const audioManager = this.desk.app.world.audioManager;
    const sound = audioManager.playAudio("doorOpen", {
      volume: 0.24,
      position: new THREE.Vector3(-6550, 0, 16135),
      refDistance: 7000,
      filter: { type: "lowpass", frequency: 3800 },
    });
    // Remove microphone rumble while preserving the recorded latch and hinge.
    const audio = audioManager.audioPool[sound];
    const highpass = audioManager.context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 110;
    audio.setFilters([highpass, ...audio.getFilters()]);
    // The lever moves on the first frame; the door follows the released latch.
    new TWEEN.Tween(this.handle.rotation)
      .to({ z: Math.PI / 7 }, reduced ? 1 : 160)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
      })
      .onComplete(() => {
        this.swing(Math.PI * 0.54);
        new TWEEN.Tween(this.handle.rotation)
          .to({ z: 0 }, reduced ? 1 : 280)
          .delay(reduced ? 0 : 180)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(() => {
            this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
          })
          .start();
      })
      .start();
  }
  close(done: () => void) {
    this.swing(0, () => {
      this.desk.app.world.audioManager.playAudio("doorClose", {
        volume: 0.5,
        position: new THREE.Vector3(-6550, 0, 16135),
        refDistance: 7000,
        filter: { type: "lowpass", frequency: 3800 },
      });
      done();
    });
  }
  private swing(angle: number, done?: () => void) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    new TWEEN.Tween(this.hinge.rotation)
      .to({ y: angle }, reduced ? 1 : 1400)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
      })
      .onComplete(() => done?.())
      .start();
  }
}
