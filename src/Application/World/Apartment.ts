import { createWovenRug } from "./TextilesLighting";
import * as THREE from "three";
import PersonalDesk from "./PersonalDesk";
import Room from "./Room";

/** Furnishes the unused wings, leaving the office and central entry aisle intact. */
export default class Apartment {
  private oak = this.desk.material(0xb68a60);
  private sage = this.desk.material(0x849789);
  private cream = this.desk.material(0xe8dcc4);
  private dark = this.desk.material(0x343b38);
  private brass = this.desk.material(0xb99864, 0.55);
  private clay = this.desk.material(0xba7954);

  constructor(
    private desk: PersonalDesk,
    private room: Room,
  ) {
    this.kitchen();
    this.dining();
    this.living();
  }

  private zone(name: string, x: number, z: number, rotation = 0) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    this.room.group.add(group);
    return group;
  }

  private box(
    g: THREE.Group,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat = this.oak,
    radius = 12,
  ) {
    return this.desk.box(w, h, d, x, y, z, mat, radius, g);
  }

  private cylinder(
    g: THREE.Group,
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    mat = this.oak,
    top = r,
  ) {
    return this.desk.cylinder(r, h, x, y, z, mat, top, g);
  }

  private rug(g: THREE.Group, w: number, d: number, color: string) {
    const rug = createWovenRug(w, d, color);
    rug.position.y = -2305;
    g.add(rug);
  }

  private kitchen() {
    // Local +z faces into the apartment from the left wall. Counter ends
    // before the dining nook; its working aisle remains west of the entry path.
    const g = this.zone(
      "Kitchen — sage cabinets and oak shelves",
      -12400,
      6300,
      Math.PI / 2,
    );
    const stone = this.desk.material(0xeee7d8);
    const steel = this.desk.material(0xaab3af, 0.7);
    steel.roughness = 0.28;
    this.box(g, 6500, 150, 1000, 0, -2230, 0, this.dark);
    this.box(g, 6500, 1610, 60, 0, -1370, -520, this.sage);
    for (const x of [-3220, 3220])
      this.box(g, 60, 1610, 1100, x, -1370, 0, this.sage);
    // Tile joints remain legible without individual high-poly tiles.
    const tiles = this.room.texture((ctx) => {
      ctx.fillStyle = "#d1c9b6";
      ctx.fillRect(0, 0, 512, 512);
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 4; col++) {
          ctx.fillStyle = (row + col) % 3 ? "#e8e4d7" : "#deded0";
          ctx.fillRect(col * 128 + 3, row * 128 + 3, 122, 122);
        }
    });
    tiles.wrapS = THREE.RepeatWrapping;
    tiles.repeat.set(5, 1);
    const tileMaterial = new THREE.MeshStandardMaterial({
      map: tiles,
      roughness: 0.45,
    });
    this.box(g, 6500, 1450, 28, 0, 185, -550, tileMaterial, 1);
    for (let i = 0; i < 6; i++) {
      const x = -2700 + i * 1080;
      this.box(g, 1035, 1490, 40, x, -1350, 574, this.sage, 7);
      this.box(g, 280, 28, 40, x, -750, 610, this.brass, 8);
    }
    // Counter surrounds an actual recessed sink basin.
    this.box(g, 3430, 90, 1220, -1605, -515, 20, stone);
    this.box(g, 2080, 90, 1220, 2280, -515, 20, stone);
    this.box(g, 1130, 90, 185, 675, -515, -497.5, stone);
    this.box(g, 1130, 90, 265, 675, -515, 497.5, stone);
    this.box(g, 1130, 35, 770, 675, -770, -20, steel);
    for (const x of [125, 1225])
      this.box(g, 30, 260, 770, x, -640, -20, steel, 3);
    for (const z of [-390, 350])
      this.box(g, 1130, 260, 30, 675, -640, z, steel, 3);
    this.desk.line(
      [
        [675, -490, -455],
        [675, 20, -455],
        [675, 170, -280],
        [675, 40, -110],
      ],
      28,
      steel,
      g,
    );
    this.cylinder(g, 42, 140, 930, -400, -450, steel);
    // Oven and flush induction hob.
    this.box(g, 940, 1010, 50, -1640, -1480, 609, this.dark);
    this.box(
      g,
      790,
      620,
      12,
      -1640,
      -1530,
      640,
      this.desk.material(0x192423),
      20,
    );
    this.box(g, 710, 42, 75, -1640, -1070, 675, steel);
    this.box(g, 1030, 28, 900, -1640, -455, 10, this.dark, 20);
    for (const x of [-1920, -1390])
      for (const z of [-220, 240]) {
        const ring = this.desk.mesh(
          new THREE.TorusGeometry(155, 7, 6, 32),
          steel,
          x,
          -437,
          z,
          g,
        );
        ring.rotation.x = Math.PI / 2;
      }
    for (const x of [-1870, -1410]) {
      const knob = this.cylinder(g, 48, 25, x, -890, 650, this.brass);
      knob.rotation.x = Math.PI / 2;
    }
    // Tall cream fridge at the far end, away from the existing office storage.
    this.box(g, 1400, 3700, 1250, -4020, -455, 35, this.cream, 65);
    for (const [y, h] of [
      [-1250, 1980],
      [585, 1590],
    ])
      this.box(g, 1310, h, 65, -4020, y, 695, stone, 25);
    for (const y of [-700, 430])
      this.box(g, 45, 650, 65, -3500, y, 755, this.brass);
    // Open oak shelves, pottery, glass jars and a cutting board.
    for (const y of [1020, 1900]) {
      this.box(g, 4400, 70, 490, 1000, y, -330);
      for (const x of [-900, 2700])
        this.box(g, 35, 280, 350, x, y - 140, -360, this.brass);
    }
    for (let i = 0; i < 5; i++) {
      this.cylinder(
        g,
        110,
        280 + (i % 2) * 80,
        -550 + i * 390,
        1200 + (i % 2) * 40,
        -310,
        i % 2 ? this.clay : this.cream,
      );
      this.cylinder(
        g,
        115,
        25,
        -550 + i * 390,
        1352 + (i % 2) * 80,
        -310,
        this.oak,
      );
    }
    for (let i = 0; i < 4; i++)
      this.cylinder(g, 230, 35, 2250, 1090 + i * 35, -280, stone);
    this.cylinder(g, 160, 390, 200, 2130, -310, this.sage, 100);
    this.cylinder(g, 210, 290, 820, 2080, -310, this.clay, 120);
    this.box(g, 650, 45, 450, 2440, -445, 110, this.oak, 55);
    this.cylinder(g, 195, 145, 2440, -350, 110, this.cream, 245);
    for (let i = 0; i < 3; i++)
      this.desk.mesh(
        new THREE.SphereGeometry(80, 16, 12),
        this.desk.material(i === 1 ? 0xcbb45e : 0x9eae72),
        2340 + i * 95,
        -275,
        100,
        g,
      );
    const strip = this.desk.material(0xffe1ac);
    strip.emissive.setHex(0xffcd8a);
    strip.emissiveIntensity = 0.65;
    const diffuser = this.box(g, 4300, 15, 45, 1000, 978, -120, strip, 2);
    diffuser.castShadow = false;
    const taskLights = [-500, 1000, 2500].map((x) => {
      const light = new THREE.SpotLight(0xffdfb5, 0.9, 2600, 1.05, 0.8, 1.5);
      light.name = "Kitchen shelf task light";
      light.position.set(x, 950, -100);
      light.target.position.set(x, -500, 160);
      g.add(light, light.target);
      return light;
    });
    const toggleStrip = this.room.lights.register("kitchen-task", "Kitchen task lights", (stripOn) => {
      strip.emissiveIntensity = stripOn ? 0.65 : 0;
      taskLights.forEach((light) => (light.intensity = stripOn ? 0.9 : 0));
    });
    this.room.interactions.add(diffuser, "Toggle kitchen task lighting", toggleStrip);
  }

  private dining() {
    const g = this.zone("Dining nook — round oak table", -10200, 12600);
    this.cylinder(g, 1050, 100, 0, -850, 0);
    this.cylinder(g, 110, 1350, 0, -1575, 0);
    this.cylinder(g, 650, 65, 0, -2270, 0);
    for (const side of [-1, 1]) {
      const chair = new THREE.Group();
      chair.position.z = side * 1470;
      chair.rotation.y = side === 1 ? Math.PI : 0;
      g.add(chair);
      for (const x of [-300, 300])
        for (const z of [-300, 300])
          this.box(chair, 65, 780, 65, x, -1915, z, this.oak);
      this.box(chair, 780, 120, 720, 0, -1500, 0, this.sage, 60);
      for (const x of [-320, 320]) this.box(chair, 60, 940, 60, x, -1030, -320);
      this.box(chair, 760, 460, 100, 0, -830, -320, this.oak, 45);
    }
    this.cylinder(g, 130, 330, 0, -635, 0, this.clay, 90);
    for (const x of [-100, 30, 130])
      this.desk.line(
        [
          [0, -530, 0],
          [x, -220, 30],
          [x + 55, -130, 50],
        ],
        9,
        this.sage,
        g,
      );
    this.box(g, 420, 35, 320, -500, -780, 100, this.cream);
    this.cylinder(g, 90, 160, 490, -720, 110, this.cream);
    this.room.plant(-11900, -2305, 15000);
  }

  private living() {
    // Sofa faces the media console on the sage wall. Both ends are open;
    // the central path at x=-6550 and the old reading corner stay clear.
    const g = this.zone("Living room — linen sofa and woven rug", -400, 10300);
    this.rug(g, 6500, 5700, "#b7a68b");
    const linen = this.desk.material(0xd5ceb9);
    const sofa = new THREE.Group();
    sofa.name = "Three-seat sofa";
    sofa.position.x = -2300;
    sofa.rotation.y = Math.PI / 2;
    g.add(sofa);
    for (const x of [-1650, 1650])
      for (const z of [-490, 490])
        this.box(sofa, 110, 300, 110, x, -2160, z, this.oak);
    this.box(sofa, 3900, 310, 1480, 0, -1870, 0, linen, 110);
    this.box(sofa, 3900, 1000, 290, 0, -1360, -630, linen, 120);
    for (const x of [-1840, 1840])
      this.box(sofa, 280, 710, 1500, x, -1550, 0, linen, 100);
    for (const x of [-1150, 0, 1150]) {
      this.box(sofa, 1100, 230, 1160, x, -1600, 100, this.cream, 100);
      const back = this.box(sofa, 1080, 660, 240, x, -1180, -390, linen, 100);
      back.rotation.x = -0.1;
    }
    for (const [x, color] of [
      [-1350, this.clay],
      [1290, this.sage],
    ] as const) {
      const pillow = this.box(sofa, 580, 560, 230, x, -1230, -80, color, 100);
      pillow.rotation.z = x < 0 ? 0.16 : -0.16;
    }
    this.box(sofa, 550, 35, 1100, 700, -1460, 170, this.sage, 12);
    this.box(sofa, 550, 370, 35, 700, -1640, 730, this.sage, 12);
    // Low rounded coffee table, with space around all four sides.
    this.box(g, 1450, 100, 2350, 150, -1370, 0, this.oak, 200);
    for (const x of [-340, 640])
      for (const z of [-820, 820])
        this.box(g, 95, 890, 95, x, -1855, z, this.oak);
    this.box(g, 560, 60, 420, 130, -1285, -420, this.sage);
    this.box(g, 510, 35, 390, 150, -1235, -400, this.cream);
    this.cylinder(g, 230, 45, 130, -1295, 490, this.clay);
    this.cylinder(g, 85, 150, 130, -1200, 490, this.cream);
    // Console and television rotate together to face the sofa.
    const media = new THREE.Group();
    media.position.x = 3800;
    media.rotation.y = -Math.PI / 2;
    g.add(media);
    for (const x of [-1550, 1550])
      for (const z of [-300, 300])
        this.box(media, 80, 290, 80, x, -2160, z, this.dark);
    this.box(media, 3600, 840, 850, 0, -1635, 0, this.oak);
    this.box(media, 3640, 65, 900, 0, -1185, 0, this.oak);
    for (const x of [-1200, 0, 1200]) {
      this.box(media, 1140, 720, 30, x, -1620, 440, this.cream);
      this.box(media, 180, 25, 35, x, -1390, 475, this.brass);
    }
    this.box(media, 2950, 1710, 100, 0, 5, -130, this.dark, 35);
    // A quiet, matte screen reflects the room's palette instead of glowing blue.
    const screen = this.desk.material(0x263633, 0.18);
    screen.roughness = 0.3;
    this.box(media, 2830, 1590, 12, 0, 5, -73, screen, 15);
    for (const x of [-970, 970])
      this.box(media, 90, 380, 360, x, -995, -100, this.dark);
    this.cylinder(g, 420, 70, -2300, -1200, -2580);
    this.cylinder(g, 65, 1030, -2300, -1750, -2580, this.dark);
    this.cylinder(g, 270, 45, -2300, -2280, -2580, this.dark);
    this.cylinder(g, 145, 360, -2300, -985, -2580, this.clay, 100);
    const shadeMaterial = this.cream.clone();
    shadeMaterial.emissive.setHex(0xffd9ac);
    shadeMaterial.emissiveIntensity = 0.18;
    const shade = this.cylinder(
      g,
      310,
      390,
      -2300,
      -620,
      -2580,
      shadeMaterial,
      190,
    );
    shade.castShadow = false;
    const tableLight = new THREE.PointLight(0xffd7a4, 0.85, 4200, 2);
    tableLight.name = "Living room table lamp illumination";
    tableLight.position.set(-2300, -620, -2580);
    g.add(tableLight);
    const toggleLamp = this.room.lights.register("living-table", "Living room table lamp", (lampOn) => {
      tableLight.intensity = lampOn ? 0.85 : 0;
      shadeMaterial.emissiveIntensity = lampOn ? 0.18 : 0;
    });
    this.room.interactions.add(shade, "Toggle living room table lamp", toggleLamp);
    this.room.plant(3210, -2305, 13750);
  }
}
