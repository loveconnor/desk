import * as THREE from "three";
import PersonalDesk from "./PersonalDesk";

export default class Hallway {
  group = new THREE.Group();
  constructor(desk: PersonalDesk) {
    this.group.name = "Apartment corridor — paneling, sconces, tiled landing";
    desk.app.scene.add(this.group);
    const plaster = desk.material(0xbdb4a4),
      panel = desk.material(0x53605b),
      trim = desk.material(0x354740),
      brass = desk.material(0xb99a60, 0.5);
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
      const count = Math.max(1, Math.floor((w - 160) / 740));
      const panelWidth = Math.min(620, w - 180);
      const gap = (w - count * panelWidth) / (count + 1);
      for (let i = 0; i < count; i++) {
        const cx = left + gap + panelWidth / 2 + i * (panelWidth + gap);
        for (const sign of [-1, 1]) {
          box(
            32,
            1298,
            28,
            cx + sign * (panelWidth / 2 - 16),
            -1370,
            16282,
            trim,
          );
          box(panelWidth, 32, 28, cx, -1370 + sign * 665, 16282, trim);
        }
      }
    }
    box(70000, 100, 95, -5000, 2660, 16280, trim);
    box(70000, 80, 180, -5000, 2790, 16270, plaster);
    box(70000, 130, 9400, -5000, 2900, 20900, plaster);
    for (const x of [-40060, 30060]) {
      box(120, 5300, 9600, x, 300, 20900, plaster);
      box(150, 1800, 9600, x, -1370, 20900);
    }
    const tileA = desk.material(0xb9b3a6),
      tileB = desk.material(0xa6a89f);
    for (let row = 0; row < 12; row++)
      for (let col = 0; col < 94; col++) {
        box(
          744,
          28,
          744,
          -39625 + col * 750,
          -2305,
          16600 + row * 750,
          (row + col) % 2 ? tileA : tileB,
        );
      }
    // Entry mat and brass doorbell.
    const matCanvas = document.createElement("canvas");
    matCanvas.width = 1024;
    matCanvas.height = 512;
    const ctx = matCanvas.getContext("2d")!;
    ctx.fillStyle = "#b48650";
    ctx.fillRect(0, 0, 1024, 512);
    // Short interwoven strands give the surface the coarse texture of coir.
    for (let i = 0; i < 38000; i++) {
      const x = (i * 193.37) % 1024,
        y = (i * 83.71) % 512;
      ctx.strokeStyle =
        i % 3 === 0 ? "rgba(63,38,16,.26)" : "rgba(238,197,130,.32)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2 + (i % 5), y - 3);
      ctx.stroke();
    }
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
    box(2720, 32, 1320, -6550, -2278, 17200, desk.material(0x393128));
    const matSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(2670, 1270),
      new THREE.MeshStandardMaterial({ map: matTexture, roughness: 1 }),
    );
    matSurface.name = "Coir WELCOME mat";
    matSurface.rotation.x = -Math.PI / 2;
    matSurface.position.set(-6550, -2261, 17200);
    matSurface.receiveShadow = true;
    this.group.add(matSurface);
    box(160, 290, 85, -4900, 220, 16325, brass);
    const button = desk.cylinder(
      43,
      20,
      -4900,
      235,
      16380,
      trim,
      43,
      this.group,
    );
    button.rotation.x = Math.PI / 2;
    for (const x of [-9100, -4000]) {
      box(210, 650, 55, x, 1040, 16300, brass);
      const shade = new THREE.MeshStandardMaterial({
        color: 0xf2dfb7,
        emissive: 0xffd39a,
        emissiveIntensity: 0.65,
        roughness: 0.6,
      });
      desk.cylinder(125, 470, x, 1070, 16465, shade, 125, this.group);
      for (const y of [820, 1320])
        desk.cylinder(145, 35, x, y, 16465, brass, 145, this.group);
      const light = new THREE.PointLight(0xffdbac, 1.3, 8500, 2);
      light.position.set(x, 1200, 16900);
      this.group.add(light);
    }
    // Neighboring doors anchor the corridor's scale.
    for (const x of [-11100, -1500]) {
      // A recessed leaf sits inside three solid jambs, with a narrow reveal.
      // The casing projects beyond the leaf instead of sitting behind it.
      for (const side of [-1, 1])
        box(85, 4170, 160, x + side * 907.5, -195, 16260, trim);
      box(1730, 85, 160, x, 1847.5, 16260, trim);
      box(1730, 45, 160, x, -2257.5, 16260, trim);
      box(1714, 4024, 70, x, -215, 16255, desk.material(0x715745));
      for (const y of [-1700, -200, 1350]) {
        box(55, 135, 18, x - 837, y, 16300, brass);
        desk.cylinder(18, 155, x - 865, y, 16310, brass, 18, this.group);
      }
      box(80, 260, 35, x + 630, -150, 16307, brass);
      box(210, 45, 75, x + 560, -150, 16352, brass);
    }
  }
}
