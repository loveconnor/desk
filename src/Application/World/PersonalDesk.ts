import { assetLoadingManager } from "../Utils/assetLoading";
import ScreenBar from "./ScreenBar";
import DellMonitor from "./DellMonitor";
import NordikDeskMat from "./NordikDeskMat";
import { DESK_WALL_OFFSET_Z } from "./deskLayout";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import NuphyAir75 from "./NuphyAir75";
import LogitechSpeakers from "./LogitechSpeakers";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import Application from "../Application";
import {
  bindKeyboard,
  keyboardState,
} from "../../keyboard/KeyboardState";
import StandingDesk from "./StandingDesk";
import PaperPhysics from "./PaperPhysics";
import { openDocument } from "../../documents/Documents";

/** Connor's photographed desk, modeled in the original scene's miniature style. */
export default class PersonalDesk {
  app = new Application();
  group = new THREE.Group();
  daylight = new THREE.HemisphereLight(0xfff8ed, 0x737579, 0.16);
  sunlight = new THREE.DirectionalLight(0xfff7e8, 0.65);
  desktop = new THREE.Group();
  lift: StandingDesk;
  screenBar: ScreenBar;
  private resumeMaterial: THREE.MeshStandardMaterial;
  private readerAmbient = NaN;
  columns: THREE.Mesh[] = [];
  chairModel = new THREE.Group();
  casters: THREE.Group[] = [];
  chairWheels: THREE.Mesh[] = [];
  chairTravel = 0;
  chairAside = false;
  fixed = new Set<THREE.Object3D>();
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
    const roomObjects = new Set(this.group.children);
    this.desk();
    this.monitor();
    this.accessories();
    for (const object of [...this.group.children]) {
      if (!roomObjects.has(object) && !this.fixed.has(object))
        this.desktop.add(object);
    }
    this.group.add(this.desktop);
    this.lift = new StandingDesk(this);
    this.chair();
    const assembly = new THREE.Group();
    assembly.name = "Desk setup — against back wall";
    for (const object of [...this.group.children]) {
      if (!roomObjects.has(object)) assembly.add(object);
    }
    assembly.position.z = DESK_WALL_OFFSET_Z;
    this.group.add(assembly);
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
    this.app.scene.add(this.daylight);
    const sun = this.sunlight;
    sun.position.set(-3500, 6000, 3500);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -14000,
      right: 14000,
      top: 14000,
      bottom: -14000,
      near: 100,
      far: 45000,
    });
    sun.shadow.normalBias = 1;
    sun.shadow.bias = -0.00005;
    sun.shadow.radius = 4;
    this.app.scene.add(sun);
    this.app.scene.add(sun.target);
    const floor = this.mesh(
      new THREE.PlaneGeometry(17100, 18225),
      this.material(0xc8c5bf),
      -4450,
      -2550,
      7022.5,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    this.app.renderer.instance.shadowMap.enabled = true;
    this.app.renderer.instance.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  desk() {
    this.box(3600, 95, 1700, 0, -48, 100, this.black, 45);
    for (const x of [-1480, 1480]) {
      const column = this.box(135, 1000, 145, x, -1110, 70, this.black);
      this.columns.push(column);
      this.fixed.add(column);
      this.fixed.add(this.box(180, 900, 185, x, -1810, 70, this.edge));
      this.fixed.add(this.box(220, 85, 1390, x, -2240, 100, this.black, 35));
      this.box(800, 110, 120, x * 0.62, -210, 0, this.edge);
    }
    this.box(2900, 100, 110, 0, -320, -450, this.black);
    this.box(3330, 85, 670, 0, 310, -345, this.black, 20);
    for (const x of [-1550, 1550])
      this.box(90, 285, 590, x, 140, -345, this.black);
    for (const x of [-1110, 1110]) {
      // Drawer cabinet rests on the desktop and meets the shelf above.
      this.box(790, 40, 590, x, 19, -345, this.black, 5);
      for (const side of [-380, 380])
        this.box(30, 230, 590, x + side, 152.5, -345, this.black, 4);
      this.box(730, 230, 550, x, 152.5, -345, this.edge, 8);
      this.box(90, 48, 12, x, 195, -62, this.silver, 3);
    }
    const mat = new NordikDeskMat(
      this.app.renderer.instance.capabilities.getMaxAnisotropy(),
    );
    mat.position.set(-170, 0, 365);
    this.group.add(mat);
  }
  monitor() {
    this.group.add(new DellMonitor());
    this.screenBar = new ScreenBar(this);
    const speakers = new LogitechSpeakers(this.app.renderer.instance);
    this.group.add(speakers);
    speakers.ready.catch(error => console.error('Unable to load Logitech speakers', error));
  }
  accessories() {
    const keyboard = new NuphyAir75(this.app.renderer.instance);
    // Model millimeters to the same 22.5 units/cm used by the mouse and mat.
    keyboard.scale.setScalar(2.25);
    keyboard.position.set(-230, NordikDeskMat.surfaceY, 440);
    keyboard.rotation.y = -0.035;
    this.group.add(keyboard);
    this.keys = keyboard.keys;
    this.mxMasterMouse();
    const texture = new THREE.TextureLoader(assetLoadingManager).load("/resume/preview.png");
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy =
      this.app.renderer.instance.capabilities.getMaxAnisotropy();
    const physics = new PaperPhysics();
    // The physical sheet receives the same illumination as the desk beneath it.
    // The enlarged document reader retains its own accessible contrast.
    this.resumeMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const paper = this.mesh(physics.geometry, this.resumeMaterial, 1330, 3, 440);
    paper.name = "Clickable résumé";
    paper.userData.hoverLabel = "Read résumé";
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
      paper.parent!.worldToLocal(destination);
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
    const mug = new THREE.Group();
    mug.name = "Glazed ceramic mug and coffee";
    mug.position.set(-1430, 12, 390);
    this.group.add(mug);
    const ceramic = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x9b2924).convertSRGBToLinear(),
      roughness: 0.23,
      clearcoat: 0.65,
      clearcoatRoughness: 0.16,
    });
    // Closed cross-section: rounded foot, tapered wall, rolled lip, inner cavity.
    const profile = [
      [0, 0], [68, 0], [80, 2], [88, 8], [91, 18],
      [94, 55], [100, 140], [103, 173], [102, 181],
      [99, 185], [95, 185], [92, 181], [92, 174],
      [89, 140], [83, 55], [80, 24], [73, 18], [0, 18],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    this.mesh(new THREE.LatheGeometry(profile, 96), ceramic, 0, 0, 0, mug);
    const handle = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-94, 148, 0), new THREE.Vector3(-144, 154, 0),
      new THREE.Vector3(-169, 120, 0), new THREE.Vector3(-168, 76, 0),
      new THREE.Vector3(-142, 42, 0), new THREE.Vector3(-91, 40, 0),
    ]);
    this.mesh(new THREE.TubeGeometry(handle, 48, 14, 12, false), ceramic, 0, 0, 0, mug);
    const coffee = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x26130a).convertSRGBToLinear(),
      roughness: 0.16,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const liquid = this.mesh(new THREE.CircleGeometry(90, 96), coffee, 0, 162, 0, mug);
    liquid.rotation.x = -Math.PI / 2;
    liquid.castShadow = false;
    // Curved meniscus meets the inner wall below the lip.
    this.mesh(new THREE.LatheGeometry([
      new THREE.Vector2(86, 162), new THREE.Vector2(88, 162.3),
      new THREE.Vector2(90, 163), new THREE.Vector2(91, 165),
    ], 96), coffee, 0, 0, 0, mug).castShadow = false;

  }

  mxMasterMouse() {
    const mouse = new THREE.Group();
    mouse.name = "Logitech MX Master 4 — official pale grey model";
    mouse.position.set(545, NordikDeskMat.surfaceY + 1, 460);
    mouse.rotation.y = -0.1;
    this.group.add(mouse);
    new GLTFLoader(assetLoadingManager).load("/room/mouse/mx-master-4.glb", ({ scene }) => {
      // Logitech's AR asset is in meters. Match the room's 22.5 units/cm scale.
      scene.scale.setScalar(2250);
      scene.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(scene);
      const center = bounds.getCenter(new THREE.Vector3());
      scene.position.set(-center.x, -bounds.min.y, -center.z);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        // The AR mesh already carries fine occlusion in its material. Receiving
        // coarse room shadows on these tiny overlapping shells creates acne.
        object.receiveShadow = false;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of materials) {
          if (material.map)
            material.map.anisotropy =
              this.app.renderer.instance.capabilities.getMaxAnisotropy();
        }
      });
      mouse.add(scene);
      this.app.renderer.instance.shadowMap.needsUpdate = true;
    });
  }

  chair() {
    const chair = this.chairModel;
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
      const caster = new THREE.Group();
      caster.position.set(x, -2240, z);
      chair.add(caster);
      this.casters.push(caster);
      for (const offset of [-35, 35]) {
        const wheel = this.cylinder(70, 42, offset, 0, 0, frame, 70, caster);
        this.chairWheels.push(wheel);
        wheel.rotation.z = Math.PI / 2;
      }
    }
  }
  rollChair(dt: number) {
    if (this.lift.height > -480) this.chairAside = true;
    if (this.lift.height < -560) this.chairAside = false;
    const before = this.chairModel.position.clone();
    const camera = this.app.camera;
    const view = camera.targetKeyframe || camera.currentKeyframe;
    const closeView = view === "desk" || view === "monitor" || camera.freeCam || view === "orbitControlsStart";
    const goal = this.chairAside || closeView ? 1 : 0;
    this.chairTravel = THREE.MathUtils.damp(this.chairTravel, goal, 4, dt);
    if (Math.abs(this.chairTravel - goal) < 0.001) this.chairTravel = goal;
    const t = this.chairTravel;
    // Pull back before curving left, leaving space between the desk and chair.
    this.chairModel.position.set(-1750 * t * t, 0, 1840 + 1000 * t);
    this.chairModel.rotation.y = -0.22 * t;
    const delta = this.chairModel.position.clone().sub(before);
    const distance = delta.length();
    if (distance > 0.001) {
      const heading = Math.atan2(delta.x, delta.z) - this.chairModel.rotation.y;
      this.casters.forEach((caster) => {
        caster.rotation.y = heading;
      });
      this.chairWheels.forEach((wheel) => {
        wheel.rotation.y += distance / 70;
      });
      this.app.renderer.instance.shadowMap.needsUpdate = true;
    }
  }

  update() {
    this.screenBar.update();
    const ambient = THREE.MathUtils.clamp(
      this.daylight.intensity + (this.app.world?.room?.lampOn ? 0.14 : 0), 0, 1,
    );
    // Carry the room's warmth into the enlarged reader without sacrificing
    // document contrast in the darkest environment.
    if (ambient !== this.readerAmbient) {
      this.readerAmbient = ambient;
      document.documentElement.style.setProperty("--paper-reader-brightness", String(0.82 + ambient * 0.18));
      document.documentElement.style.setProperty("--paper-reader-sepia", String((1 - ambient) * 0.08));
    }
    this.lift.update();
    const now = performance.now();
    const dt = Math.min((now - this.lastKeyFrame) / 1000, 0.05);
    this.lastKeyFrame = now;
    this.rollChair(dt);
    let moving = false;
    this.keys.forEach((key, code) => {
      const target = key.userData.restY - (keyboardState.pressed.has(code) ? key.userData.travel : 0);
      if (Math.abs(target - key.position.y) < 0.01) return;
      key.position.y += (target - key.position.y) * (1 - Math.exp(-45 * dt));
      if (Math.abs(target - key.position.y) < 0.01) key.position.y = target;
      moving = true;
    });
    if (moving) this.app.renderer.instance.shadowMap.needsUpdate = true;
  }
}
