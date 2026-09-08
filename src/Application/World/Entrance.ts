import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import Hallway from "./Hallway";
import PersonalDesk from "./PersonalDesk";

export default class Entrance {
  hinge = new THREE.Group();
  constructor(private desk: PersonalDesk) {
    const frame = desk.material(0xd4bd95);
    const wall = desk.material(0xe8e1d4);
    const wood = desk.material(0x8a6145);
    const brass = desk.material(0xc4a16b, 0.6);
    const z = 16135;
    // Solid front wall with a genuine opening, matching the room boundary.
    desk.box(32300, 7830, 150, -23850, 1585, z, wall).receiveShadow = false;
    desk.box(35400, 7830, 150, 12300, 1585, z, wall).receiveShadow = false;
    desk.box(2300, 3500, 150, -6550, 3750, z, wall).receiveShadow = false;
    for (const x of [-7750, -5350])
      desk.box(160, 4370, 250, x, -145, z, frame, 12);
    desk.box(2560, 160, 250, -6550, 2080, z, frame, 12);
    desk.box(2450, 60, 330, -6550, -2290, z, brass, 8);
    // A small landing outside the doorway, without a floating floor edge.
    desk.box(70000, 90, 9400, -5000, -2365, 20450, desk.material(0xbfa484), 1);
    this.hinge.position.set(-7700, -2310, z);
    desk.app.scene.add(this.hinge);
    desk.box(2300, 4290, 115, 1150, 2145, 0, wood, 16, this.hinge);
    const inset = desk.material(0x9c7352);
    for (const y of [1030, 3090]) {
      desk.box(1960, 1840, 28, 1150, y, 70, frame, 8, this.hinge);
      desk.box(1840, 1720, 34, 1150, y, 89, inset, 8, this.hinge);
    }
    desk.box(120, 340, 35, 2010, 2100, 83, brass, 18, this.hinge);
    desk.box(310, 60, 80, 1900, 2140, 140, brass, 25, this.hinge);
    for (const y of [650, 2145, 3660])
      desk.box(70, 170, 150, 25, y, 0, brass, 10, this.hinge);
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d4bd95";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#283930";
    ctx.textAlign = "center";
    ctx.font = "bold 120px Georgia";
    ctx.textBaseline = "middle";
    ctx.fillText("Connor Love", 512, 134);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = desk.app.renderer.instance.capabilities.getMaxAnisotropy();
    desk.box(1180, 320, 38, 1150, 3220, 126, brass, 12, this.hinge);
    const plaque = desk.mesh(
      new THREE.PlaneGeometry(1120, 280),
      new THREE.MeshBasicMaterial({ map: texture }),
      1150,
      3220,
      151,
      this.hinge,
    );
    plaque.castShadow = false;
    const light = new THREE.PointLight(0xffe6bb, 0.8, 11000, 2);
    light.position.set(-6200, 3000, 19500);
    desk.app.scene.add(light);
    new Hallway(desk);
    desk.app.renderer.instance.shadowMap.needsUpdate = true;
  }
  open() {
    this.swing(Math.PI * 0.54);
  }
  close(done: () => void) {
    this.swing(0, done);
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
