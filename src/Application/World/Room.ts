import RoomWindow from "./RoomWindow";
import { bookArtwork, ArtFace } from "./bookArtwork";
import * as THREE from "three";
import RoomInteractions from "./RoomInteractions";
import { roomBooks, roomNotes } from "./roomContent";
import PersonalDesk from "./PersonalDesk";

/** Open room corner; dimensions use the same miniature scale as the desk. */
export default class Room {
  group = new THREE.Group();
  interactions: RoomInteractions;
  clockHands: THREE.Group[] = [];
  roomWindow!: RoomWindow;
  lampOn = true;
  lampLight!: THREE.PointLight;
  constructor(private desk: PersonalDesk) {
    this.interactions = new RoomInteractions(desk.app);
    this.group.name = "Connor's room — first pass";
    desk.app.scene.add(this.group);
    // Portrait framing pulls back farther; keep the room inside the clear range.
    desk.app.scene.fog = new THREE.Fog(0xc6c3bd, 65000, 180000);
    this.architecture();
    this.interior();
    this.window();
    this.furnishings();
    this.officeDetails();
    this.storageCorner();
    this.roomWindow = new RoomWindow(desk, this);
    desk.app.renderer.instance.shadowMap.needsUpdate = true;
  }

  box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.MeshStandardMaterial,
    radius = 8,
  ) {
    return this.desk.box(w, h, d, x, y, z, material, radius, this.group);
  }

  texture(draw: (ctx: CanvasRenderingContext2D) => void, resolution = 512) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = resolution;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(resolution / 512, resolution / 512);
    draw(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = Math.min(
      8,
      this.desk.app.renderer.instance.capabilities.getMaxAnisotropy(),
    );
    return texture;
  }

  artwork(face: ArtFace, width: number, height: number) {
    const texture = new THREE.TextureLoader().load("/room/books/" + face.file);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy =
      this.desk.app.renderer.instance.capabilities.getMaxAnisotropy();
    const geometry = new THREE.PlaneGeometry(width, height, 24, 24);
    if (face.corners) {
      const [tl, tr, br, bl] = face.corners;
      const uv = geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        const x = uv.getX(i),
          y = 1 - uv.getY(i);
        uv.setXY(
          i,
          (tl[0] * (1 - x) + tr[0] * x) * (1 - y) +
            (bl[0] * (1 - x) + br[0] * x) * y,
          1 -
            ((tl[1] * (1 - x) + tr[1] * x) * (1 - y) +
              (bl[1] * (1 - x) + br[1] * x) * y),
        );
      }
    }
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    mesh.castShadow = false;
    return mesh;
  }

  architecture() {
    const plaster = this.desk.material(0xe8e1d4);
    const sage = this.desk.material(0x9aab9c);
    const trim = this.desk.material(0xf3ead9);
    const oak = this.desk.material(0xac7950);
    this.box(17100, 190, 18225, -4450, -2430, 7022.5, oak, 35);
    const grain = this.texture((ctx) => {
      ctx.fillStyle = "#bd9368";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 150; i++) {
        ctx.strokeStyle =
          i % 3 ? "rgba(90,55,30,.09)" : "rgba(255,230,184,.17)";
        ctx.beginPath();
        const y = (i * 73) % 512;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(140, y + 8, 380, y - 8, 512, y + 2);
        ctx.stroke();
      }
    });
    const boards = [0xcda579, 0xc19a70, 0xd5b187, 0xc9a177].map((color) => {
      const material = this.desk.material(color);
      material.map = grain;
      return material;
    });
    // Continuous flooring extends behind the wide camera; no platform edge.
    for (let row = 0; row < 45; row++) {
      for (let col = 0; col < 10; col++) {
        const start = -13000 + col * 1900 - (row % 2 ? 950 : 0);
        const left = Math.max(-13000, start);
        const right = Math.min(4100, start + 1900);
        if (right <= left) continue;
        this.box(
          right - left - 5,
          22,
          400,
          (left + right) / 2,
          -2324,
          -1887.5 + row * 405,
          boards[(row + col) % 4],
          1,
        );
      }
    }
    // Back wall is built around a real opening for the window.
    this.box(9350, 7830, 140, -8325, 1585, -2100, plaster);
    this.box(5650, 7830, 140, 1275, 1585, -2100, plaster);
    this.box(2100, 2300, 140, -2600, -1180, -2100, plaster);
    this.box(2100, 3330, 140, -2600, 3835, -2100, plaster);
    this.box(140, 7830, 18225, 4100, 1585, 7022.5, sage);
    this.box(17100, 120, 45, -4450, -2250, -2005, trim);
    this.box(45, 120, 18225, 4005, -2250, 7022.5, trim);
  }

  interior() {
    // Complete the room beyond the wide camera without blocking the key light.
    const plaster = this.desk.material(0xe8e1d4);
    const plane = (
      w: number,
      h: number,
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
    ) => {
      const mesh = this.desk.mesh(
        new THREE.PlaneGeometry(w, h),
        plaster,
        x,
        y,
        z,
        this.group,
      );
      mesh.rotation.set(rx, ry, 0);
      mesh.castShadow = false;
      return mesh;
    };
    plane(18225, 7830, -13000, 1585, 7022.5, 0, Math.PI / 2);

    // Fixed ceiling clears the elevated overview without changing any camera.
    const ceiling = plane(17100, 18225, -4450, 5500, 7022.5, Math.PI / 2, 0);
    ceiling.name = "Apartment ceiling — fixed height";
    const ceilingPaint = this.desk.material(0xf2eee5);
    ceilingPaint.roughness = 1;
    ceiling.material = ceilingPaint;
    const cornice = this.desk.material(0xf3ead9);
    for (const z of [-2015, 16035]) {
      this.box(17000, 90, 75, -4450, 5420, z, cornice, 4);
      this.box(17000, 35, 110, -4450, 5475, z, cornice, 3);
    }
    for (const x of [-12915, 4015]) {
      this.box(75, 90, 18100, x, 5420, 7022.5, cornice, 4);
      this.box(110, 35, 18100, x, 5475, 7022.5, cornice, 3);
    }
  }

  window() {
    const frame = this.desk.material(0xf6ecd9);
    for (const x of [-3650, -2600, -1550])
      this.box(65, 2200, 160, x, 1070, -1990, frame);
    for (const y of [-30, 1070, 2170])
      this.box(2180, 65, 160, -2600, y, -1990, frame);
    this.box(2340, 85, 390, -2600, -65, -1910, frame, 15);
  }

  furnishings() {
    const oak = this.desk.material(0xb68a60);
    const cream = this.desk.material(0xe8dcc4);
    const charcoal = this.desk.material(0x343b38);
    const rugMap = this.texture((ctx) => {
      ctx.fillStyle = "#a2aaa0";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#ded6bd";
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, 476, 476);
      ctx.strokeRect(26, 26, 460, 460);
      for (let i = 0; i < 512; i += 3) {
        ctx.fillStyle = i % 2 ? "rgba(255,255,240,.07)" : "rgba(25,45,35,.05)";
        ctx.fillRect(i, 0, 1, 512);
        ctx.fillRect(0, i, 512, 1);
      }
    });
    const rug = this.desk.material(0xffffff);
    rug.map = rugMap;
    const mat = this.desk.mesh(
      new THREE.PlaneGeometry(4750, 4400),
      rug,
      -150,
      -2305,
      1470,
      this.group,
    );
    mat.rotation.x = -Math.PI / 2;
    mat.castShadow = false;

    // Low storage to the right of the desk, with books and a record sleeve.
    this.box(1450, 1150, 720, 3010, -1720, -1410, oak, 18);
    this.box(1340, 960, 25, 3010, -1710, -1038, charcoal);
    this.box(1450, 65, 760, 3010, -1110, -1390, oak);
    this.box(1390, 45, 700, 3010, -1690, -1400, oak);
    this.box(45, 1100, 700, 3010, -1720, -1400, oak);
    const bookColors = [0xd6c7a6, 0x6c837c, 0xb26748, 0xc6a053, 0x394e56];
    for (let i = 0; i < 7; i++) {
      const x = 2400 + i * 75;
      const height = 350 + (i % 3) * 55;
      this.box(
        61,
        height,
        360,
        x,
        -1660 + height / 2,
        -1210,
        this.desk.material(bookColors[i % 5]),
        3,
      );
      this.box(42, 7, 2, x, -1540, -1028, cream, 1);
    }
    this.box(450, 300, 440, 3340, -2100, -1290, cream, 12);
    this.box(110, 35, 5, 3340, -2010, -1067, oak);
    for (let i = 0; i < 3; i++)
      this.box(
        500 - i * 30,
        55,
        340,
        2640,
        -1050 + i * 55,
        -1380,
        this.desk.material(bookColors[i]),
        3,
      );

    // Small floating shelf with a vinyl sleeve, echoing the desktop's playlist.
    this.box(1550, 65, 400, 2880, 840, -1800, oak);
    this.box(560, 590, 40, 3190, 1165, -1910, charcoal);
    const record = this.desk.mesh(
      new THREE.CircleGeometry(220, 48),
      this.desk.material(0xb36c50),
      3190,
      1175,
      -1870,
      this.group,
    );
    this.desk.mesh(
      new THREE.CircleGeometry(60, 24),
      cream,
      3190,
      1175,
      -1860,
      this.group,
    );
    record.castShadow = false;
    for (let i = 0; i < 4; i++)
      this.box(
        65,
        310 + i * 25,
        220,
        2330 + i * 78,
        1028 + i * 12.5,
        -1830,
        this.desk.material(bookColors[i]),
        3,
      );

    this.plant(-3020, -2305, -730);
    // Compact ceramic vase on the sideboard.
    this.desk.cylinder(110, 290, 3420, -920, -1380, cream, 75, this.group);
  }

  officeDetails() {
    const oak = this.desk.material(0xa77a50);
    const dark = this.desk.material(0x343c39);
    const cream = this.desk.material(0xe6d7ba);
    const paper = this.desk.material(0xf0e9d8);
    const palette = [0x526f6c, 0xc38157, 0xd8c59f, 0x3b4c5a, 0xa4ad91].map(
      (c) => this.desk.material(c),
    );

    // A full-height bookcase anchors the window side of the office.
    const x = -5350;
    this.box(1950, 3750, 80, x, -435, -1940, oak);
    for (const offset of [-950, 950])
      this.box(85, 3750, 650, x + offset, -435, -1620, oak);
    for (let row = 0; row < 6; row++) {
      const y = -2270 + row * 730;
      this.box(1950, 75, 700, x, y, -1600, oak);
      if (row === 5) continue;
      if (row === 0 || row === 3) {
        for (let i = 0; i < 2; i++) {
          this.box(690, 440, 500, x - 445 + i * 875, y + 260, -1560, cream, 25);
          this.box(180, 65, 12, x - 445 + i * 875, y + 290, -1298, dark, 7);
        }
      } else {
        for (let i = 0; i < 11; i++) {
          const height = 400 + ((i * 71 + row * 43) % 160);
          const bx = x - 795 + i * 130;
          const index = (i + row * 3) % roomBooks.length;
          const book = roomBooks[index];
          const ratios = [
            163 / 250,
            322 / 500,
            311 / 400,
            382 / 500,
            381 / 500,
            381 / 500,
            378 / 500,
            381 / 500,
            131 / 160,
            381 / 500,
            293 / 500,
          ];
          const width = height * ratios[index];
          const volume = new THREE.Group();
          volume.position.set(bx, y + 40 + height / 2, -1530);
          volume.rotation.y = Math.PI / 2;
          this.group.add(volume);
          const binding = this.desk.material(parseInt(book.color.slice(1), 16));
          this.desk.box(
            width - 8,
            height - 14,
            78,
            0,
            0,
            0,
            this.desk.material(0xe7dfcd),
            3,
            volume,
          );
          for (const z of [-47, 47])
            this.desk.box(width, height, 10, 0, 0, z, binding, 2, volume);
          this.desk.box(
            12,
            height,
            104,
            -width / 2 + 2,
            0,
            0,
            binding,
            3,
            volume,
          );
          const faces = bookArtwork[index];
          const front = this.artwork(
            faces?.front || { file: index + ".jpg" },
            width - 4,
            height - 4,
          );
          front.position.z = 53;
          volume.add(front);
          if (faces?.back) {
            const back = this.artwork(faces.back, width - 4, height - 4);
            back.position.z = -53;
            back.rotation.y = Math.PI;
            volume.add(back);
          }
          const spine = this.texture((ctx) => {
            ctx.fillStyle = [
              "#f7f7f5",
              "#f4d929",
              "#7b171b",
              "#252522",
              "#c51f27",
              "#fffdf8",
              "#f5d21d",
              "#fffdf8",
              "#ed9828",
              "#fffdf8",
              "#191919",
            ][index];
            ctx.fillRect(0, 0, 512, 512);
            ctx.translate(256, 256);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = [0, 1, 5, 6, 7, 8, 9].includes(index)
              ? "#171919"
              : "#f8e9cc";
            ctx.textAlign = "center";
            ctx.font = "28px sans-serif";
            ctx.fillText(book.title, 0, 0, 460);
            ctx.font = "18px sans-serif";
            ctx.fillText(book.author, 0, 70, 460);
          }, 2048);
          const label = faces?.spine
            ? this.artwork(faces.spine, 98, height - 4)
            : new THREE.Mesh(
                new THREE.PlaneGeometry(98, height - 4),
                new THREE.MeshBasicMaterial({ map: spine }),
              );
          label.position.set(-width / 2 - 6, 0, 0);
          label.rotation.y = -Math.PI / 2;
          label.castShadow = false;
          volume.add(label);
          this.interactions.pickup(
            volume,
            {
              title: book.title,
              subtitle: book.author,
              body: book.topic,
              href: book.url,
            },
            width,
            height,
          );
        }
      }
    }

    // A low reading chair faces into the office, clear of the desk chair.
    const seat = new THREE.Group();
    seat.name = "Reading corner";
    seat.position.set(3100, 0, 3300);
    seat.rotation.y = -1.3;
    this.group.add(seat);
    const upholstery = this.desk.material(0xba7954);
    const cushion = this.desk.material(0xc88d65);
    const part = (
      w: number,
      h: number,
      d: number,
      px: number,
      py: number,
      pz: number,
      mat = upholstery,
      r = 70,
    ) => this.desk.box(w, h, d, px, py, pz, mat, r, seat);
    for (const px of [-510, 510])
      for (const pz of [-420, 420]) part(90, 390, 90, px, -2110, pz, oak, 12);
    part(1280, 240, 1130, 0, -1850, 0);
    part(1110, 210, 950, 0, -1630, 70, cushion);
    part(1330, 1050, 230, 0, -1300, -490);
    for (const px of [-655, 655]) part(230, 580, 1190, px, -1520, 0);
    const pillow = part(560, 550, 180, 180, -1260, -290, cream, 85);
    pillow.rotation.z = -0.16;
    // A folded throw over one arm.
    part(260, 40, 650, -665, -1210, 140, palette[0], 15);
    part(35, 580, 650, -795, -1490, 140, palette[0], 15);

    // Lamp behind the outer shoulder; table beside the opposite arm.
    // Keep this grouping off the desk rug and its chair's circulation space.
    this.desk.cylinder(260, 60, 3580, -2270, 2070, dark, 260, this.group);
    this.desk.cylinder(28, 2850, 3580, -820, 2070, dark, 28, this.group);
    const shadeMaterial = cream.clone();
    shadeMaterial.emissive.setHex(0xffc177);
    shadeMaterial.emissiveIntensity = 0.28;
    const shade = this.desk.cylinder(
      430,
      520,
      3580,
      660,
      2070,
      shadeMaterial,
      270,
      this.group,
    );
    const bulb = new THREE.PointLight(0xffcc88, 1.65, 10000, 2);
    bulb.position.set(3500, 340, 2100);
    bulb.castShadow = true;
    bulb.shadow.mapSize.set(1024, 1024);
    bulb.shadow.bias = -0.0005;
    bulb.shadow.normalBias = 8;
    bulb.shadow.camera.near = 40;
    bulb.shadow.camera.far = 15000;
    shade.castShadow = false;
    this.group.add(bulb);
    this.lampLight = bulb;
    this.interactions.add(shade, "Toggle reading lamp", () => {
      this.lampOn = !this.lampOn;
      bulb.intensity = this.lampOn ? 1.65 : 0;
      this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
      shadeMaterial.emissiveIntensity = this.lampOn ? 0.28 : 0;
    });

    const tableX = 3000;
    const tableZ = 4720;
    this.desk.cylinder(400, 85, tableX, -1380, tableZ, oak, 400, this.group);
    this.desk.cylinder(55, 890, tableX, -1865, tableZ, dark, 55, this.group);
    this.desk.cylinder(270, 45, tableX, -2280, tableZ, dark, 270, this.group);
    this.box(380, 55, 270, tableX - 70, -1310, tableZ - 60, palette[0], 3);
    this.box(350, 25, 255, tableX - 70, -1270, tableZ - 60, paper, 2);
    this.desk.cylinder(
      65,
      130,
      tableX + 180,
      -1270,
      tableZ + 150,
      cream,
      72,
      this.group,
    );

    // A working pinboard gives the otherwise blank sage wall a purpose.
    const board = new THREE.Group();
    board.position.set(4000, 1450, 550);
    board.rotation.y = -Math.PI / 2;
    this.group.add(board);
    this.desk.box(2350, 1500, 75, 0, 0, 0, oak, 12, board);
    this.desk.box(
      2250,
      1400,
      20,
      0,
      0,
      55,
      this.desk.material(0xbca17b),
      3,
      board,
    );
    for (let i = 0; i < 6; i++) {
      const px = -710 + (i % 3) * 710;
      const py = i < 3 ? 330 : -330;
      const note = this.desk.box(
        490,
        490,
        8,
        px,
        py,
        78,
        i % 2 ? paper : cream,
        1,
        board,
      );
      note.rotation.z = ((i % 3) - 1) * 0.06;
      this.desk.mesh(
        new THREE.SphereGeometry(20, 8, 8),
        palette[i % 5],
        px,
        py + 210,
        100,
        board,
      );
      const content = roomNotes[i];
      const noteTexture = this.texture((ctx) => {
        ctx.fillStyle = "#9d6248";
        ctx.font = "22px sans-serif";
        ctx.fillText(content.subtitle, 35, 70);
        ctx.fillStyle = "#263a35";
        ctx.font = "32px Georgia";
        ctx.fillText(content.title, 35, 140, 442);
        ctx.font = "23px sans-serif";
        let line = "",
          ly = 210;
        for (const word of content.body.split(/\s+/)) {
          if (ctx.measureText(line + word).width > 442) {
            ctx.fillText(line.trim(), 35, ly);
            line = "";
            ly += 34;
          }
          line += word + " ";
        }
        ctx.fillText(line.trim(), 35, ly);
      }, 2048);
      const surface = this.desk.mesh(
        new THREE.PlaneGeometry(470, 470),
        new THREE.MeshBasicMaterial({
          map: noteTexture,
          transparent: true,
          depthWrite: false,
        }),
        px,
        py,
        82.5,
        board,
      );
      surface.rotation.z = note.rotation.z;
      surface.castShadow = false;
      const item = new THREE.Group();
      item.position.set(px, py, 78);
      board.add(item);
      board.updateWorldMatrix(true, true);
      item.attach(note);
      item.attach(surface);
      this.interactions.pickup(item, content, 490, 490);
    }

    // A clock above the bookcase and a basket by the desk complete the room.
    const clockPartsStart = this.group.children.length;
    const clock = this.desk.mesh(
      new THREE.CylinderGeometry(340, 340, 60, 48),
      dark,
      -5350,
      2350,
      -1930,
      this.group,
    );
    clock.rotation.x = Math.PI / 2;
    const face = this.desk.mesh(
      new THREE.CircleGeometry(302, 48),
      paper,
      -5350,
      2350,
      -1890,
      this.group,
    );
    face.castShadow = false;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const tick = this.box(
        12,
        40,
        5,
        -5350 + Math.sin(angle) * 263,
        2350 + Math.cos(angle) * 263,
        -1880,
        dark,
        1,
      );
      tick.rotation.z = -angle;
    }
    for (const [length, width, z, color] of [
      [155, 18, -1870, 0x343c39],
      [240, 12, -1855, 0x343c39],
      [260, 5, -1840, 0xb76b49],
    ]) {
      const pivot = new THREE.Group();
      pivot.position.set(-5350, 2350, z);
      this.group.add(pivot);
      const hand = this.desk.box(
        width,
        length,
        8,
        0,
        length / 2,
        0,
        this.desk.material(color),
        2,
        pivot,
      );
      hand.castShadow = false;
      this.clockHands.push(pivot);
    }
    const clockParts = this.group.children.slice(clockPartsStart);
    const clockAssembly = new THREE.Group();
    clockAssembly.position.set(-5350, 2350, -1930);
    this.group.add(clockAssembly);
    this.group.updateWorldMatrix(true, true);
    for (const part of clockParts) clockAssembly.attach(part);
    this.interactions.pickup(
      clockAssembly,
      {
        title: "Local time",
        subtitle: "CLOCK",
        body: "Your current local time.",
      },
      680,
      680,
    );
    // Open-sided bin with visible discarded cans rather than a solid lid.
    const binMat = this.desk.material(0x8c9a8c);
    binMat.side = THREE.DoubleSide;
    this.desk.mesh(
      new THREE.CylinderGeometry(270, 225, 510, 32, 1, true),
      binMat,
      -2110,
      -2050,
      -570,
      this.group,
    );
    this.desk.cylinder(220, 12, -2110, -2290, -570, dark, 220, this.group);
    const rim = this.desk.mesh(
      new THREE.TorusGeometry(270, 12, 8, 48),
      binMat,
      -2110,
      -1795,
      -570,
      this.group,
    );
    rim.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const can = new THREE.Group();
      const a = i * 2.4;
      can.position.set(
        -2110 + Math.cos(a) * 130,
        -1930 + (i % 3) * 45,
        -570 + Math.sin(a) * 130,
      );
      can.rotation.set((i % 2 ? 1 : -1) * 0.35, a, 0.25);
      can.scale.set(0.7, 1, 0.7);
      this.group.add(can);
      const mat = this.desk.material(0x111711, 0.55);
      mat.roughness = 0.35;
      // Lathed aluminum silhouette: rolled rims and tapered shoulders.
      const profile = [
        [-116, 54],
        [-113, 58],
        [-108, 62],
        [-103, 63],
        [91, 63],
        [101, 60],
        [110, 55],
        [114, 56],
      ].map(([y, r]) => new THREE.Vector2(r, y));
      this.desk.mesh(
        new THREE.LatheGeometry(profile, 64, Math.PI / 2, Math.PI),
        mat,
        0,
        0,
        0,
        can,
      );
      const art = new THREE.TextureLoader().load(
        "/room/monster/original-500ml.jpg",
      );
      art.encoding = THREE.sRGBEncoding;
      art.anisotropy =
        this.desk.app.renderer.instance.capabilities.getMaxAnisotropy();
      // Project the photographed can onto the matching curved silhouette.
      // Front and rear meet at the sides; there is no overlapping label sleeve.
      const wrap = new THREE.LatheGeometry(profile, 96, -Math.PI / 2, Math.PI);
      const positions = wrap.attributes.position;
      const uv = wrap.attributes.uv;
      for (let v = 0; v < uv.count; v++) {
        uv.setXY(
          v,
          0.5 + (positions.getX(v) / 126) * 0.357,
          0.01 + ((positions.getY(v) + 116) / 232) * 0.982,
        );
      }
      this.desk.mesh(
        wrap,
        new THREE.MeshBasicMaterial({ map: art }),
        0,
        0,
        0,
        can,
      );
      for (const y of [-113, 114]) {
        this.desk.cylinder(56, 5, 0, y, 0, this.desk.silver, 56, can);
        const rim = this.desk.mesh(
          new THREE.TorusGeometry(57, 3, 8, 48),
          this.desk.silver,
          0,
          y + 2,
          0,
          can,
        );
        rim.rotation.x = Math.PI / 2;
      }
      const opening = this.desk.mesh(
        new THREE.CircleGeometry(14, 24),
        dark,
        0,
        118,
        -20,
        can,
      );
      opening.rotation.x = -Math.PI / 2;
      opening.scale.x = 0.7;
      const tab = this.desk.mesh(
        new THREE.TorusGeometry(12, 4, 8, 24),
        this.desk.material(0x8ecc28, 0.5),
        0,
        120,
        4,
        can,
      );
      tab.rotation.x = Math.PI / 2;
      tab.scale.y = 1.5;
      this.interactions.pickup(
        can,
        {
          title: "Monster Energy",
          subtitle: "DESK-SIDE RECYCLING",
          body: "Empty Monster cans from the desk. Time to take out the recycling.",
        },
        130,
        240,
      );
    }
    this.update();
  }

  update() {
    this.roomWindow?.update();
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    [hours / 12, minutes / 60, seconds / 60].forEach((turn, i) => {
      if (this.clockHands[i])
        this.clockHands[i].rotation.z = -turn * Math.PI * 2;
    });
  }

  storageCorner() {
    const oak = this.desk.material(0xa77a50);
    const dark = this.desk.material(0x343c39);
    const cream = this.desk.material(0xe6d7ba);
    const white = this.desk.material(0xf0e9d8);
    const x = -8600;
    // Storage and printing station to the left of the bookcase.
    for (const dx of [-1190, 1190])
      for (const z of [-1780, -1060])
        this.box(100, 300, 100, x + dx, -2160, z, dark, 10);
    this.box(2800, 1260, 940, x, -1420, -1440, oak, 15);
    this.box(2870, 75, 1010, x, -755, -1440, oak, 10);
    for (const dx of [-905, 0, 905]) {
      this.box(865, 1120, 35, x + dx, -1420, -947, cream, 7);
      this.box(230, 35, 30, x + dx, -1040, -910, dark, 5);
    }
    // Printer sits directly on the cabinet, with a paper tray and output slot.
    this.box(950, 360, 680, x + 520, -537, -1430, dark, 35);
    this.box(910, 70, 640, x + 520, -322, -1440, white, 14);
    this.box(660, 40, 400, x + 520, -697, -990, dark, 5);
    this.box(500, 12, 275, x + 520, -670, -950, white, 2);
    this.box(640, 65, 12, x + 520, -565, -1082, this.desk.black, 3);
    for (let i = 0; i < 3; i++)
      this.box(
        650 - i * 35,
        65,
        460,
        x - 720,
        -684 + i * 65,
        -1400,
        i % 2 ? cream : this.desk.material(0x526f6c),
        4,
      );
    // Two large framed prints make this a deliberate part of the room.
    for (let i = 0; i < 2; i++) {
      const cx = x - 750 + i * 1500;
      this.box(1240, 1580, 70, cx, 750, -1950, oak, 5);
      this.box(1140, 1480, 12, cx, 750, -1906, white, 2);
      const art = this.texture((ctx) => {
        ctx.fillStyle = "#eee3cd";
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = i ? "#aa674b" : "#526f6c";
        ctx.beginPath();
        ctx.arc(256, 200, 135, 0, Math.PI * 2);
        ctx.fill();
        for (let j = 0; j < 5; j++) {
          ctx.fillStyle = j % 2 ? "#eee3cd" : "#a8af96";
          ctx.fillRect(70, 300 + j * 25, 372, 13);
        }
      });
      const print = this.desk.mesh(
        new THREE.PlaneGeometry(990, 1310),
        new THREE.MeshStandardMaterial({ map: art, roughness: 1 }),
        cx,
        750,
        -1890,
        this.group,
      );
      print.castShadow = false;
    }
    this.plant(-11050, -2305, -1380);
  }

  plant(x: number, floor: number, z: number) {
    const clay = this.desk.material(0xbc7856);
    const soil = this.desk.material(0x484135);
    const stem = this.desk.material(0x566342);
    this.desk.cylinder(240, 520, x, floor + 260, z, clay, 320, this.group);
    this.desk.cylinder(295, 15, x, floor + 518, z, soil, 295, this.group);
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4;
      const height = 1000 + (i % 4) * 250;
      const end = new THREE.Vector3(
        x + Math.cos(angle) * 400,
        floor + height,
        z + Math.sin(angle) * 400,
      );
      this.desk.line(
        [[x, floor + 510, z], [x, floor + height - 250, z], end.toArray()],
        13,
        stem,
        this.group,
      );
      const leaf = this.desk.mesh(
        new THREE.SphereGeometry(1, 12, 8),
        this.desk.material(i % 2 ? 0x647d50 : 0x405e42),
        end.x,
        end.y,
        end.z,
        this.group,
      );
      leaf.scale.set(180, 370, 45);
      leaf.rotation.set(0.25, -angle, -Math.cos(angle) * 0.6);
    }
  }
}
