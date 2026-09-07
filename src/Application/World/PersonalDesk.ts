import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import Application from "../Application";
import {
  bindKeyboard,
  keyboardState,
  keyRows,
} from "../../keyboard/KeyboardState";
import PaperPhysics from "./PaperPhysics";
import { openDocument } from "../../documents/Documents";

/** Connor's photographed desk, modeled in the original scene's miniature style. */
export default class PersonalDesk {
  app = new Application();
  group = new THREE.Group();
  black = this.material(0x252628);
  edge = this.material(0x37383a);
  silver = this.material(0xaeb2b5, 0.45);
  white = this.material(0xe4e5df);
  keys = new Map<string, THREE.Group>();
  lastKeyFrame = performance.now();
  constructor() {
    bindKeyboard();
    this.group.name = "Connor's standing desk";
    this.app.scene.add(this.group);
    this.lighting();
    this.desk();
    this.monitor();
    this.accessories();
    this.chair();
    this.app.renderer.instance.shadowMap.autoUpdate = false;
    this.app.renderer.instance.shadowMap.needsUpdate = true;
  }
  material(color: number, metalness = 0) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).convertSRGBToLinear(),
      roughness: 0.8,
      metalness,
    });
  }
  mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = this.group,
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat = this.black,
    r = 12,
    parent: THREE.Object3D = this.group,
  ) {
    return this.mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)),
      mat,
      x,
      y,
      z,
      parent,
    );
  }
  cylinder(
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    mat = this.black,
    rt = r,
    parent: THREE.Object3D = this.group,
  ) {
    return this.mesh(
      new THREE.CylinderGeometry(rt, r, h, 24),
      mat,
      x,
      y,
      z,
      parent,
    );
  }
  line(
    points: number[][],
    radius: number,
    mat = this.black,
    parent: THREE.Object3D = this.group,
  ) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    );
    return this.mesh(
      new THREE.TubeGeometry(curve, 32, radius, 8, false),
      mat,
      0,
      0,
      0,
      parent,
    );
  }
  fabric(color: string, grid = false) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 4)
      for (let x = 0; x < 128; x += 4) {
        ctx.fillStyle = grid
          ? "#101314"
          : (x * 17 + y * 31) % 7 < 3
            ? "#535451"
            : "#3c3e3c";
        ctx.fillRect(x, y, grid ? 2 : 1, grid ? 2 : 1);
      }
    const texture = new THREE.CanvasTexture(c);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(grid ? 8 : 5, grid ? 8 : 3);
    texture.encoding = THREE.sRGBEncoding;
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      side: THREE.DoubleSide,
    });
  }
  lighting() {
    this.app.scene.background = new THREE.Color(0xc6c3bd);
    this.app.scene.fog = new THREE.Fog(0xc6c3bd, 12000, 35000);
    this.app.renderer.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.app.renderer.instance.toneMappingExposure = 0.85;
    this.app.scene.add(new THREE.HemisphereLight(0xfff8ed, 0x737579, 1.05));
    const sun = new THREE.DirectionalLight(0xfff7e8, 1.2);
    sun.position.set(-3500, 6000, 3500);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -5000,
      right: 5000,
      top: 5000,
      bottom: -5000,
      near: 100,
      far: 15000,
    });
    sun.shadow.normalBias = 5;
    sun.shadow.bias = -0.0002;
    sun.shadow.radius = 4;
    this.app.scene.add(sun);
    this.app.scene.add(sun.target);
    const fill = new THREE.DirectionalLight(0xcbdcf7, 0.45);
    fill.position.set(3000, 2000, -2500);
    this.app.scene.add(fill);
    const floor = this.mesh(
      new THREE.PlaneGeometry(200000, 200000),
      this.material(0xc8c5bf),
      0,
      -2320,
      0,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    this.app.renderer.instance.shadowMap.enabled = true;
    this.app.renderer.instance.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  desk() {
    this.box(3600, 95, 1700, 0, -48, 100, this.black, 45);
    for (const x of [-1480, 1480]) {
      this.box(135, 2090, 145, x, -1110, 70, this.black);
      this.box(180, 900, 185, x, -1810, 70, this.edge);
      this.box(220, 85, 1390, x, -2240, 100, this.black, 35);
      this.box(800, 110, 120, x * 0.62, -210, 0, this.edge);
    }
    this.box(2900, 100, 110, 0, -320, -450, this.black);
    this.box(3330, 85, 670, 0, 310, -345, this.black, 20);
    for (const x of [-1550, 1550])
      this.box(90, 285, 590, x, 140, -345, this.black);
    for (const x of [-1110, 1110]) {
      this.box(730, 225, 550, x, 150, -345, this.edge, 8);
      this.box(90, 48, 12, x, 195, -62, this.silver, 3);
    }
    this.box(2210, 18, 1020, -170, 14, 365, this.fabric("#454642"), 35);
    this.box(55, 12, 36, 950, 27, 575, this.material(0xb96735), 3);
    this.box(310, 85, 65, 1260, -125, 945, this.edge, 25);
    for (let i = 0; i < 5; i++)
      this.box(24, 14, 3, 1180 + i * 40, -115, 980, this.silver, 3);
  }
  monitor() {
    // Four bezel rails leave the CSS3D screen aperture transparent.
    const z = -260,
      cy = 950,
      w = 1800,
      h = 1012;
    this.box(w + 58, 28, 78, 0, cy + h / 2 + 14, z - 25, this.black, 10);
    this.box(w + 58, 50, 78, 0, cy - h / 2 - 25, z - 25, this.black, 10);
    for (const x of [-w / 2 - 14, w / 2 + 14])
      this.box(28, h, 78, x, cy, z - 25, this.black, 10);
    this.box(1200, 650, 95, 0, 960, z - 100, this.black, 40);
    this.box(95, 350, 100, 0, 510, -380, this.edge, 12);
    this.box(550, 35, 320, 0, 370, -340, this.black, 25);
    this.box(1370, 42, 55, 0, 1495, -230, this.black, 20);
    this.box(150, 90, 170, 0, 1500, -345, this.edge, 18);
    this.box(1270, 8, 35, 0, 1470, -211, this.material(0xffdeb0), 3);
    const glow = new THREE.PointLight(0xffce85, 0.5, 2200, 2);
    glow.position.set(0, 1250, 30);
    this.group.add(glow);
    const stickerTexture = new THREE.TextureLoader().load(
      "/branding/connor-love-sticker.svg",
    );
    stickerTexture.encoding = THREE.sRGBEncoding;
    const sticker = this.mesh(
      new THREE.PlaneGeometry(220, 43),
      new THREE.MeshBasicMaterial({ map: stickerTexture }),
      -715,
      cy - h / 2 - 25,
      z + 16,
    );
    sticker.name = "Connor Love monitor sticker";
    for (const x of [-1120, 1120]) {
      this.box(220, 500, 210, x, 590, -360, this.black, 28);
      for (const y of [475, 700]) {
        const disc = this.cylinder(80, 15, x, y, -247, this.edge);
        disc.rotation.x = Math.PI / 2;
        const cone = this.cylinder(61, 20, x, y, -232, this.black);
        cone.rotation.x = Math.PI / 2;
        const ring = this.mesh(
          new THREE.TorusGeometry(79, 4, 8, 32),
          this.silver,
          x,
          y,
          -234,
        );
      }
    }
    const green = this.material(0x59ca73);
    this.mesh(new THREE.SphereGeometry(7, 8, 8), green, -1120, 394, -246);
  }
  accessories() {
    // Compact keyboard with the distinctive yellow and orange accent keys.
    const keyboard = new THREE.Group();
    keyboard.position.set(-230, 49, 440);
    keyboard.rotation.y = -0.035;
    this.group.add(keyboard);
    this.box(940, 40, 345, 0, 0, 0, this.black, 22, keyboard);
    const makeKey = (
      code: string,
      x: number,
      z: number,
      width = 51,
      mat = this.edge,
    ) => {
      const key = new THREE.Group();
      key.name = `Keycap ${code}`;
      key.position.set(x, 29, z);
      keyboard.add(key);
      this.box(width, 22, 51, 0, 0, 0, mat, 5, key);
      if (code !== "Space")
        this.box(13, 1, 3, -3, 12, -10, this.silver, 1, key);
      this.keys.set(code, key);
    };
    keyRows.forEach((row, r) =>
      row.forEach((code, c) => {
        if (!code) return;
        const mat =
          r === 0 && c === 13
            ? this.material(0xf3c84e)
            : r === 0 && c === 14
              ? this.material(0xe96a3a)
              : this.edge;
        makeKey(code, -424 + c * 60, -133 + r * 63, 51, mat);
      }),
    );
    makeKey("Space", -70, 119, 350);
    this.mxMasterMouse();
    const texture = new THREE.TextureLoader().load("/resume/preview.png");
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy =
      this.app.renderer.instance.capabilities.getMaxAnisotropy();
    const physics = new PaperPhysics();
    const paper = this.mesh(
      physics.geometry,
      new THREE.MeshBasicMaterial({
        map: texture,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
      1330,
      3,
      440,
    );
    // Preserve the fine printed strokes when the page is minified on the desk.
    (paper.material as THREE.MeshBasicMaterial).onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        "#include <map_fragment>\ndiffuseColor.rgb = pow(diffuseColor.rgb, vec3(2.4));",
      );
    };
    paper.name = "Clickable résumé";
    paper.rotation.set(-Math.PI / 2, 0, -0.12);
    // Keep the same physical sheet through pickup, reading, and return.
    const restingPosition = paper.position.clone();
    const restingRotation = paper.quaternion.clone();
    let held = false;
    let animating = false;
    const animatePaper = (
      to: THREE.Vector3,
      rotation: THREE.Quaternion,
      done: () => void,
    ) => {
      animating = true;
      const from = paper.position.clone();
      const startRotation = paper.quaternion.clone();
      const start = performance.now();
      const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 1
        : 1900;
      let previousTime = start;
      physics.reset(from);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t);
        paper.position.lerpVectors(from, to, eased);
        paper.position.y += Math.sin(Math.PI * t) * 230;
        paper.quaternion.slerpQuaternions(startRotation, rotation, eased);
        const returning = to.equals(restingPosition);
        const settle = Math.max(0, (t - 0.7) / 0.3);
        physics.step(
          (now - previousTime) / 1000,
          paper.position,
          paper.quaternion,
          settle,
          (returning && t > 0.7) || (!returning && t < 0.15),
        );
        previousTime = now;
        this.app.renderer.instance.shadowMap.needsUpdate = true;
        if (t < 1) requestAnimationFrame(step);
        else {
          // Let the residual motion settle against the desk before releasing it.
          let remaining = 28;
          const settleSheet = () => {
            physics.step(
              1 / 60,
              paper.position,
              paper.quaternion,
              1,
              returning,
            );
            this.app.renderer.instance.shadowMap.needsUpdate = true;
            if (--remaining > 0) requestAnimationFrame(settleSheet);
            else {
              animating = false;
              done();
            }
          };
          settleSheet();
        }
      };
      requestAnimationFrame(step);
    };
    const pickUp = () => {
      if (held || animating) return;
      held = true;
      this.app.camera.paperActive = true;
      const camera = this.app.camera.instance;
      const pageHeight = Math.min(
        innerHeight - 100,
        ((innerWidth - 48) * 792) / 612,
        1050,
      );
      const distance =
        576 /
        ((2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * pageHeight) /
          innerHeight);
      const destination = camera.position
        .clone()
        .add(
          camera
            .getWorldDirection(new THREE.Vector3())
            .multiplyScalar(distance),
        );
      animatePaper(destination, camera.quaternion.clone(), () => {
        openDocument("resume", undefined, true);
        // The reading surface takes over at precisely the same size and position.
        requestAnimationFrame(() => {
          paper.visible = false;
        });
      });
    };
    window.addEventListener("connor-paper-return", () => {
      if (!held || animating) return;
      paper.visible = true;
      animatePaper(restingPosition, restingRotation, () => {
        held = false;
        this.app.camera.paperActive = false;
      });
    });
    const raycaster = new THREE.Raycaster();
    const hit = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-desk-ui], button, dialog"))
        return false;
      raycaster.setFromCamera(
        new THREE.Vector2(
          (e.clientX / innerWidth) * 2 - 1,
          1 - (e.clientY / innerHeight) * 2,
        ),
        this.app.camera.instance,
      );
      return raycaster.intersectObject(paper).length > 0;
    };
    document.addEventListener(
      "mousedown",
      (e) => {
        if (!hit(e) || held || animating) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        pickUp();
      },
      true,
    );
    // A scarlet ceramic coffee mug replaces the bottle on the left.
    const ceramic = this.material(0x9b2924);
    this.cylinder(105, 175, -1430, 100, 390, ceramic, 105);
    this.cylinder(89, 5, -1430, 190, 390, this.material(0x28150e));
    const rim = this.mesh(
      new THREE.TorusGeometry(98, 7, 8, 32),
      ceramic,
      -1430,
      190,
      390,
    );
    rim.rotation.x = Math.PI / 2;
    this.mesh(
      new THREE.TorusGeometry(64, 16, 10, 28),
      ceramic,
      -1550,
      105,
      390,
    );
  }

  mxMasterMouse() {
    const mouse = new THREE.Group();
    mouse.name = "Logitech MX Master 4 — pale gray";
    mouse.position.set(545, 10, 460);
    mouse.rotation.y = -0.1;
    this.group.add(mouse);
    const shell = this.material(0xdedfdc);
    const grip = this.material(0xc3c6c4);
    const seam = this.material(0x686e6d);
    const metal = this.material(0xc4c9cc, 0.8);
    const oval = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
    ) => {
      const part = this.mesh(
        new THREE.SphereGeometry(1, 32, 20),
        mat,
        x,
        y,
        z,
        mouse,
      );
      part.scale.set(w, h, d);
      return part;
    };
    // Low thumb shelf and tall, asymmetric palm shell of the right-handed MX.
    oval(-34, 12, 12, 137, 13, 166, seam);
    oval(-87, 23, 23, 85, 20, 141, grip);
    const geometry = new THREE.SphereGeometry(1, 40, 24);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      pos.setXYZ(
        i,
        x * (102 - 12 * Math.max(0, -z)) - 15 * Math.max(0, y),
        y > 0 ? 24 + y * (110 + 16 * x + 15 * z) : 24 + y * 20,
        z * 158,
      );
    }
    geometry.computeVertexNormals();
    this.mesh(geometry, shell, 0, 0, 0, mouse);
    // Button split follows the curved top instead of floating over the shell.
    const top = (x: number, z: number) => {
      const t = z / 158,
        nx = (x + 12) / (102 - 12 * Math.max(0, -t));
      return (
        25 +
        Math.sqrt(Math.max(0, 1 - nx * nx - t * t)) * (110 + 16 * nx + 15 * t)
      );
    };
    this.line(
      [-148, -125, -100, -70, -38].map((z) => [0, top(0, z), z]),
      1.8,
      seam,
      mouse,
    );
    this.line(
      [-87, -65, -35, 0, 35, 65, 90].map((x) => [x, top(x, -38), -38]),
      1.5,
      seam,
      mouse,
    );
    const wheel = (x: number, y: number, z: number, side = false) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      if (side) g.rotation.y = Math.PI / 2;
      mouse.add(g);
      const drum = this.cylinder(21, 24, 0, 0, 0, metal, 21, g);
      drum.rotation.z = Math.PI / 2;
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 12;
        const rib = this.box(
          25,
          2,
          2,
          0,
          Math.sin(angle) * 21,
          Math.cos(angle) * 21,
          this.silver,
          0.5,
          g,
        );
        rib.rotation.x = -angle;
      }
    };
    this.box(31, 8, 55, 0, top(0, -92) - 4, -92, seam, 8, mouse);
    wheel(0, top(0, -92) + 4, -92);
    wheel(-96, 77, -20, true);
    this.box(18, 5, 22, 0, top(0, -18) + 1, -18, grip, 4, mouse);
    this.mesh(
      new THREE.SphereGeometry(3, 8, 6),
      this.material(0x51b36c),
      0,
      top(0, 8) + 2,
      8,
      mouse,
    );
    for (const z of [18, 48]) this.box(8, 12, 24, -102, 59, z, seam, 4, mouse);
    // Haptic thumb area has shallow raised ridges.
    for (let i = 0; i < 7; i++) {
      this.line(
        [
          [-146 + i * 3, 35, 5],
          [-144 + i * 3, 41, 45],
          [-130 + i * 3, 38, 86],
        ],
        1,
        shell,
        mouse,
      );
    }
  }

  chair() {
    const chair = new THREE.Group();
    chair.name = "Sihoo Doro C300 Pro — black mesh";
    chair.position.set(0, 0, 1840);
    this.group.add(chair);
    const frame = this.material(0x202425);
    const chrome = this.material(0xbfc5c8, 0.8);
    chrome.roughness = 0.26;
    // Cutouts in the weave allow the support frame to show through the mesh.
    const weave = document.createElement("canvas");
    weave.width = weave.height = 32;
    const ctx = weave.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 8, 32);
    ctx.fillRect(0, 0, 32, 5);
    const alpha = new THREE.CanvasTexture(weave);
    alpha.wrapS = alpha.wrapT = THREE.RepeatWrapping;
    alpha.repeat.set(58, 52);
    alpha.anisotropy =
      this.app.renderer.instance.capabilities.getMaxAnisotropy();
    const meshMaterial = this.material(0x414747);
    meshMaterial.alphaMap = alpha;
    meshMaterial.alphaTest = 0.35;
    meshMaterial.side = THREE.DoubleSide;
    // A bowed sheet with rounded corners, not a padded rectangular block.
    const panel = (
      name: string,
      w: number,
      h: number,
      x: number,
      y: number,
      z: number,
      bow: number,
      seat = false,
    ) => {
      const g = new THREE.Group();
      g.name = name;
      g.position.set(x, y, z);
      if (seat) g.rotation.x = -Math.PI / 2;
      chair.add(g);
      const point = (u: number, v: number) =>
        new THREE.Vector3(
          ((u * w) / 2) * (1 - 0.12 * Math.pow(Math.abs(v), 10)),
          ((v * h) / 2) * (1 - 0.08 * Math.pow(Math.abs(u), 10)),
          bow * (u * u - 0.45) + 18 * v * v,
        );
      const geo = new THREE.PlaneGeometry(2, 2, 32, 28);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const v = point(p.getX(i), p.getY(i));
        p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      this.mesh(geo, meshMaterial, 0, 0, 0, g);
      const edge: number[][] = [];
      for (let i = 0; i < 24; i++) edge.push(point(-1 + i / 12, -1).toArray());
      for (let i = 0; i < 24; i++) edge.push(point(1, -1 + i / 12).toArray());
      for (let i = 0; i < 24; i++) edge.push(point(1 - i / 12, 1).toArray());
      for (let i = 0; i < 24; i++) edge.push(point(-1, 1 - i / 12).toArray());
      const curve = new THREE.CatmullRomCurve3(
        edge.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
        true,
      );
      this.mesh(
        new THREE.TubeGeometry(curve, 120, seat ? 30 : 24, 8, true),
        frame,
        0,
        0,
        0,
        g,
      );
      return g;
    };
    panel("Suspended mesh seat", 1060, 950, 0, -1170, -15, 55, true);
    const back = panel(
      "Flexible upper backrest",
      1000,
      875,
      0,
      -305,
      430,
      -105,
    );
    back.rotation.x = -0.09;
    panel("Separate curved lumbar support", 940, 360, 0, -910, 285, 130);
    const head = panel("Adjustable mesh headrest", 590, 315, 0, 355, 455, 60);
    head.rotation.x = 0.1;
    this.box(100, 280, 70, 0, 225, 540, frame, 18, chair);
    // The C300's rear Y-shaped support is visible through the mesh.
    this.line(
      [
        [0, -1270, 380],
        [0, -850, 570],
        [0, -450, 605],
        [0, -190, 565],
      ],
      55,
      frame,
      chair,
    );
    for (const sign of [-1, 1]) {
      this.line(
        [
          [0, -410, 590],
          [sign * 210, -220, 585],
          [sign * 410, -145, 555],
        ],
        43,
        frame,
        chair,
      );
      this.line(
        [
          [0, -920, 510],
          [sign * 210, -930, 455],
          [sign * 365, -890, 410],
        ],
        30,
        frame,
        chair,
      );
      this.line(
        [
          [sign * 365, -1280, 190],
          [sign * 570, -1190, 150],
          [sign * 585, -950, 80],
          [sign * 590, -795, 45],
        ],
        38,
        frame,
        chair,
      );
      this.box(90, 100, 105, sign * 590, -795, 45, chrome, 15, chair);
      this.box(170, 65, 475, sign * 590, -715, -50, this.black, 30, chair);
      this.cylinder(47, 60, sign * 590, -750, 45, frame, 47, chair);
    }
    this.box(490, 140, 510, 0, -1295, 40, frame, 45, chair);
    this.box(230, 35, 70, 360, -1270, -100, frame, 15, chair);
    this.cylinder(52, 580, 0, -1630, 0, chrome, 52, chair);
    this.cylinder(80, 210, 0, -1920, 0, frame, 68, chair);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const x = Math.sin(a) * 650,
        z = Math.cos(a) * 650;
      this.line(
        [
          [0, -1990, 0],
          [x * 0.45, -2040, z * 0.45],
          [x, -2180, z],
        ],
        32,
        chrome,
        chair,
      );
      for (const offset of [-35, 35]) {
        const wheel = this.cylinder(
          70,
          42,
          x + offset,
          -2240,
          z,
          frame,
          70,
          chair,
        );
        wheel.rotation.z = Math.PI / 2;
      }
    }
  }
  update() {
    const now = performance.now();
    const dt = Math.min((now - this.lastKeyFrame) / 1000, 0.05);
    this.lastKeyFrame = now;
    let moving = false;
    this.keys.forEach((key, code) => {
      const target = keyboardState.pressed.has(code) ? 19 : 29;
      if (Math.abs(target - key.position.y) < 0.01) return;
      key.position.y += (target - key.position.y) * (1 - Math.exp(-45 * dt));
      if (Math.abs(target - key.position.y) < 0.01) key.position.y = target;
      moving = true;
    });
    if (moving) this.app.renderer.instance.shadowMap.needsUpdate = true;
  }
}
