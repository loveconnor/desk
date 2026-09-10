import * as THREE from "three";
import { assetLoadingManager } from "../Utils/assetLoading";
import PersonalDesk from "./PersonalDesk";
import Room from "./Room";

export default class PrinterStation {
  private group = new THREE.Group();
  constructor(
    private desk: PersonalDesk,
    private room: Room,
  ) {
    this.group.name = "Oak printer credenza and design-history gallery";
    this.group.position.set(-8600, 0, -1440);
    room.group.add(this.group);
    this.cabinet();
    this.printer();
    this.art();
  }
  private box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: THREE.MeshStandardMaterial,
    r = 4,
    parent: THREE.Object3D = this.group,
  ) {
    return this.desk.box(w, h, d, x, y, z, m, r, parent);
  }
  private label(
    text: string,
    w: number,
    h: number,
    size = 38,
    bg = "#d4d5d0",
    fg = "#313535",
  ) {
    const c = document.createElement("canvas");
    // Match the physical label so lettering keeps its natural proportions.
    c.width = Math.max(512, Math.round((128 * w) / h));
    c.height = Math.round((c.width * h) / w);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg;
    const fontSize = (size * c.height) / 128;
    ctx.font = `${fontSize}px Arial`;
    const availableWidth = c.width * 0.92;
    const fit = Math.min(1, availableWidth / ctx.measureText(text).width);
    ctx.font = `${fontSize * fit}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, c.width / 2, c.height / 2);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.65 }),
    );
  }
  private cabinet() {
    const wood = this.desk.material(0xffffff),
      paint = this.desk.material(0xd1cec3),
      dark = this.desk.material(0x343631);
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ad855e";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 800; i++) {
      ctx.strokeStyle = i % 3 ? "rgba(60,34,12,.045)" : "rgba(245,218,163,.11)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 8) {
        const y = i * 0.65 + Math.sin(x * 0.015 + i * 0.31) * 2;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    const grain = new THREE.CanvasTexture(c);
    grain.encoding = THREE.sRGBEncoding;
    grain.anisotropy = 8;
    wood.map = grain;
    wood.roughness = 0.5;
    // Separate 18 mm panels, inset back, toe recess, and genuine door reveals.
    this.box(2760, 1140, 880, 0, -1405, -15, dark);
    for (const x of [-1365, 1365]) this.box(55, 1260, 940, x, -1405, 0, wood);
    this.box(2730, 55, 940, 0, -2010, 0, wood);
    this.box(2820, 55, 980, 0, -747, 0, wood, 6);
    this.box(2760, 18, 18, 0, -781, 475, dark, 1);
    for (const x of [-912, 0, 912]) {
      this.box(898, 1170, 46, x, -1401, 482, paint, 3);
      // Slim pulls with two mounting posts, not a solid block glued to the door.
      for (const dx of [-100, 100])
        this.box(16, 16, 36, x + dx, -930, 521, dark, 3);
      this.box(238, 18, 20, x, -930, 542, dark, 7);
    }
    for (const x of [-1190, 0, 1190])
      for (const z of [-340, 340]) {
        this.desk.cylinder(38, 240, x, -2160, z, dark, 29, this.group);
        this.desk.cylinder(40, 18, x, -2285, z, dark, 40, this.group);
      }
    // Paper supply in a cloth archive box, with a fitted lid and a finger slot.
    const cloth = this.desk.material(0x53655d);
    this.box(650, 200, 520, -760, -619, -50, cloth, 9);
    this.box(672, 32, 540, -760, -503, -50, cloth, 5);
    this.box(105, 22, 3, -760, -604, 212, dark, 8);
    const label = this.label("PAPER / A4", 230, 55, 32, "#dcd6c5");
    label.position.set(-760, -565, 215);
    this.group.add(label);
  }
  private printer() {
    const g = new THREE.Group();
    g.name = "Brother HL-L2350DW-inspired laser printer";
    g.position.set(530, -715, 0);
    this.group.add(g);
    const shell = this.desk.material(0xb6b9b7),
      top = this.desk.material(0x343b3e),
      black = this.desk.material(0x111819),
      paper = this.desk.material(0xe9e7dd);
    shell.roughness = 0.58;
    top.roughness = 0.48;
    const b = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      m = shell,
      r = 5,
    ) => this.box(w, h, d, x, y, z, m, r, g);
    // 356 x 183 x 360 mm proportions, scaled to the room; no scanner lid.
    b(960, 425, 965, 0, 235, 0, shell, 23);
    b(908, 30, 920, 0, 20, 0, black, 10);
    for (const x of [-375, 375])
      for (const z of [-370, 370]) b(95, 16, 95, x, 8, z, black, 8);
    b(980, 45, 980, 0, 465, 0, top, 12);
    // The top output well has a recessed bed, raised side cheeks and paper guides.
    b(660, 17, 620, 0, 493, -35, black, 8);
    for (const x of [-415, 415]) b(140, 75, 940, x, 513, 0, top, 12);
    b(710, 70, 150, 0, 508, -407, top, 8);
    b(695, 48, 135, 0, 498, 416, top, 8);
    b(600, 12, 440, 0, 507, 15, paper, 1);
    for (const x of [-290, 290]) b(12, 16, 470, x, 515, -20, top, 2);
    b(600, 35, 35, 0, 525, 265, top, 3);
    // Front toner-access seam and pull-out paper cassette.
    b(883, 195, 18, 0, 305, 484, shell, 8);
    b(856, 4, 2, 0, 200, 495, black, 1);
    b(878, 139, 25, 0, 120, 487, shell, 6);
    b(205, 26, 8, 0, 166, 503, black, 6);
    b(838, 4, 2, 0, 47, 504, black, 1);
    const logo = this.label("brother", 250, 65, 58, "#b6b9b7");
    logo.position.set(0, 337, 496);
    g.add(logo);
    const model = this.label("HL-L2350DW", 190, 38, 34, "#b6b9b7");
    model.position.set(255, 270, 496);
    g.add(model);
    // LCD, tactile keys and green status LED on the left top shoulder.
    const display = this.label("Ready", 105, 46, 38, "#879b81", "#213526");
    display.rotation.x = -Math.PI / 2;
    display.position.set(-415, 554, 125);
    g.add(display);
    for (let i = 0; i < 3; i++) b(42, 7, 25, -415, 554, 210 + i * 40, black, 4);
    const led = this.desk.material(0x73a963);
    led.emissive.setHex(0x43842e);
    led.emissiveIntensity = 0.4;
    b(12, 5, 12, -415, 555, 355, led, 3);
    for (const side of [-1, 1])
      for (let i = 0; i < 13; i++)
        b(3, 9, 170, side * 482, 130 + i * 16, -260, black, 1);
    this.desk.line(
      [
        [350, 90, -485],
        [390, 80, -515],
        [410, -110, -530],
        [480, -1100, -520],
      ],
      9,
      black,
      g,
    );
  }
  private art() {
    const works = [
      {
        file: "mondrian",
        title: "Tableau",
        artist: "Piet Mondrian · 1921",
        ratio: 3638 / 3660,
        body: "Mondrian's De Stijl paintings reduced composition to grids, primary colors, and carefully balanced space. That visual language helped shape modern graphic design. Its relationship to web layouts is a useful design connection, rather than a claim that this painting directly originated web design.",
        href: "https://www.metmuseum.org/art/collection/search/490012",
      },
      {
        file: "lissitzky",
        title: "Proun 5A",
        artist: "El Lissitzky · 1923",
        ratio: 3759 / 4990,
        body: "Lissitzky's Proun works explored geometry, asymmetry, and spatial relationships between painting and architecture. His wider work in typography and graphic design helped establish the modern visual language of dynamic composition and hierarchy.",
        href: "https://www.moma.org/artists/3569",
      },
    ];
    const frame = this.desk.material(0x514334),
      mat = this.desk.material(0xe7e1d3),
      edge = this.desk.material(0xaaa18f);
    works.forEach((work, i) => {
      const g = new THREE.Group();
      g.name = `${work.artist} — ${work.title}`;
      g.position.set(-750 + i * 1500, 750, -510);
      this.group.add(g);
      const box = (
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m = frame,
      ) => this.box(w, h, d, x, y, z, m, 2, g);
      box(1240, 1580, 35, 0, 0, 0, edge);
      box(1190, 1530, 16, 0, 0, 27, mat);
      for (const side of [-1, 1]) {
        box(38, 1580, 75, side * 601, 0, 20);
        box(1164, 38, 75, 0, side * 771, 20);
      }
      const width = 1000,
        height = Math.min(1320, width / work.ratio),
        actualWidth = height * work.ratio;
      // Decode a local reproduction into a capped texture, preserving aspect ratio.
      const canvas = document.createElement("canvas");
      const t = new THREE.CanvasTexture(canvas);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = 8;
      new THREE.ImageLoader(assetLoadingManager).load(
        `/art/design/${work.file}.jpg`,
        (img) => {
          const scale = 1400 / Math.max(img.width, img.height);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas
            .getContext("2d")!
            .drawImage(img, 0, 0, canvas.width, canvas.height);
          t.needsUpdate = true;
        },
      );
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(actualWidth, height),
        new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }),
      );
      art.position.set(0, 50, 37);
      art.receiveShadow = true;
      g.add(art);
      const caption = this.label(
        `${work.title} / ${work.artist}`,
        1040,
        70,
        58,
        "#e7e1d3",
      );
      caption.position.set(0, -697, 38);
      g.add(caption);
      this.room.interactions.pickup(
        g,
        {
          title: work.title,
          showDescription: true,
          subtitle: work.artist,
          body: work.body,
          href: work.href,
        },
        1240,
        1580,
      );
    });
  }
}
