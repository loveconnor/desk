import { MONITOR } from "./monitorLayout";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import PersonalDesk from "./PersonalDesk";
import UIEventBus from "../UI/EventBus";
import { createScreenBarModel } from "./screenBarModel.mjs";

export const SCREENBAR_TEMPERATURES = [
  2700, 3000, 3500, 4000, 4500, 5000, 5700, 6500,
];
export type ScreenBarAction = "power" | "brightness" | "temperature" | "auto";
export interface ScreenBarState {
  on: boolean;
  brightness: number;
  temperature: number;
  auto: boolean;
}
const STORAGE_KEY = "connor-screenbar-ar17";

/** Original AR17: four touch keys, retained settings and forward task lighting. */
export default class ScreenBar {
  group = new THREE.Group();
  state: ScreenBarState = {
    on: true,
    brightness: 9,
    temperature: 4,
    auto: false,
  };
  private model: THREE.Group;
  private diffuser?: THREE.MeshStandardMaterial;
  private indicator?: THREE.MeshStandardMaterial;
  private lights: THREE.SpotLight[] = [];
  private ray = new THREE.Raycaster();
  private enabled = false;
  private held?: {
    action: ScreenBarAction | "panel";
    x: number;
    y: number;
    next: number;
    repeated: boolean;
  };
  private direction = { brightness: 1, temperature: 1 };
  private lastAuto = 0;
  private lastHeight = NaN;

  constructor(private desk: PersonalDesk) {
    this.group.name = "BenQ ScreenBar — tap to adjust";
    this.group.position.set(0, MONITOR.top + 46, MONITOR.z + 55);
    desk.group.add(this.group);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (
        saved &&
        typeof saved.on === "boolean" &&
        typeof saved.auto === "boolean" &&
        Number.isInteger(saved.brightness) &&
        saved.brightness >= 1 &&
        saved.brightness <= 15 &&
        Number.isInteger(saved.temperature) &&
        saved.temperature >= 0 &&
        saved.temperature < 8
      )
        this.state = saved;
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    // Immediate local fallback keeps the controls usable if the GLB fails to load.
    this.model = createScreenBarModel();
    this.mount(this.model);
    new GLTFLoader().load(
      "/models/screenbar/original-screenbar.glb",
      ({ scene }) => {
        this.group.remove(this.model);
        this.disposeModel(this.model);
        this.model = scene;
        this.mount(scene);
      },
      undefined,
      (error) =>
        console.warn(
          "ScreenBar GLB unavailable; using matching local geometry",
          error,
        ),
    );

    // Three overlapping soft cones approximate the linear asymmetric reflector.
    // Every cone points forward of the display, avoiding the screen and eyes.
    for (const x of [-450, 0, 450]) {
      const light = new THREE.SpotLight(0xffdfbc, 1, 2800, 0.32, 1, 1);
      light.position.set(x, -44, 23);
      light.target.position.set(x * 1.5, -1500, 840);
      // One shadow represents the continuous bar; three independent shadow
      // maps produced distracting stacked outlines under small desk objects.
      light.castShadow = x === 0;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.near = 8;
      light.shadow.camera.far = 2800;
      light.shadow.bias = -0.0001;
      light.shadow.normalBias = 0.5;
      this.group.add(light, light.target);
      this.lights.push(light);
    }
    this.apply();
    this.bindEvents();
  }

  private disposeModel(group: THREE.Group) {
    const materials = new Set<THREE.Material>();
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const list = Array.isArray(object.material)
        ? object.material
        : [object.material];
      list.forEach((material) => materials.add(material));
    });
    materials.forEach((material) => {
      (material as THREE.MeshBasicMaterial).map?.dispose();
      material.dispose();
    });
  }

  private mount(model: THREE.Group) {
    this.group.add(model);
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = object.receiveShadow = true;
      if (object.name === "Diffuser") {
        this.diffuser = object.material as THREE.MeshStandardMaterial;
        object.castShadow = false;
      }
      if (object.name === "Auto_indicator" || object.name === "Auto indicator")
        this.indicator = object.material as THREE.MeshStandardMaterial;
    });
    // Printed capacitive icons on the actual top-facing control surfaces.
    for (const [i, action] of (
      ["brightness", "temperature", "auto", "power"] as const
    ).entries()) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.strokeStyle = "#c8c9c7";
      ctx.fillStyle = "#c8c9c7";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      if (action === "power") {
        ctx.beginPath();
        ctx.arc(64, 67, 28, -Math.PI * 0.3, Math.PI * 1.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(64, 29);
        ctx.lineTo(64, 64);
        ctx.stroke();
      } else if (action === "brightness") {
        ctx.beginPath();
        ctx.arc(64, 64, 17, 0, Math.PI * 2);
        ctx.stroke();
        for (let j = 0; j < 8; j++) {
          const a = (j * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(64 + Math.cos(a) * 27, 64 + Math.sin(a) * 27);
          ctx.lineTo(64 + Math.cos(a) * 36, 64 + Math.sin(a) * 36);
          ctx.stroke();
        }
      } else if (action === "temperature") {
        ctx.beginPath();
        ctx.arc(64, 84, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(54, 72);
        ctx.lineTo(54, 33);
        ctx.quadraticCurveTo(64, 19, 74, 33);
        ctx.lineTo(74, 72);
        ctx.stroke();
      } else {
        ctx.font = "48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("A", 64, 81);
        ctx.beginPath();
        ctx.arc(64, 64, 37, 0, Math.PI * 2);
        ctx.stroke();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.encoding = THREE.sRGBEncoding;
      const icon = new THREE.Mesh(
        new THREE.PlaneGeometry(28, 28),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
        }),
      );
      icon.position.set(-135 + i * 90, 38, 0);
      icon.rotation.x = -Math.PI / 2;
      icon.name = "Control_" + action;
      model.add(icon);
    }
    this.apply();
  }

  command(action: ScreenBarAction, value?: number) {
    if (action === "power") this.state.on = !this.state.on;
    else if (!this.state.on) return;
    else if (action === "auto") {
      this.state.auto = true;
      this.state.temperature = 4;
      this.autoDim();
    } else {
      this.state.auto = false;
      const min = action === "brightness" ? 1 : 0;
      const max = action === "brightness" ? 15 : 7;
      if (value !== undefined) {
        if (!Number.isFinite(value)) return;
        this.state[action] = THREE.MathUtils.clamp(Math.round(value), min, max);
      } else {
        if (this.state[action] >= max) this.direction[action] = -1;
        if (this.state[action] <= min) this.direction[action] = 1;
        this.state[action] += this.direction[action];
      }
    }
    this.apply();
    this.save();
  }

  private autoDim() {
    // Scene illumination proxy, not a claim of calibrated physical lux.
    // Responds to the simulated sun, blinds and existing reading lamp.
    const ambient =
      this.desk.daylight.intensity * 380 +
      this.desk.sunlight.intensity * 220 +
      (this.desk.app.world?.room?.lampOn ? 55 : 0);
    this.state.brightness = THREE.MathUtils.clamp(
      Math.round(((500 - ambient) / 930) * 15),
      1,
      15,
    );
  }

  private apply() {
    const colors = [
      0xffad69, 0xffbc80, 0xffcd9c, 0xffdcb4, 0xffe5ca, 0xffeedd, 0xfff5ef,
      0xf4f7ff,
    ];
    const color = new THREE.Color(
      colors[this.state.temperature],
    ).convertSRGBToLinear();
    const level = this.state.on ? this.state.brightness / 15 : 0;
    for (const light of this.lights) {
      light.color.copy(color);
      light.intensity = level * 3.8;
    }
    if (this.diffuser) {
      this.diffuser.emissive.copy(color);
      this.diffuser.emissiveIntensity = level * 1.8;
      this.diffuser.color.setHex(this.state.on ? 0xf2ebd9 : 0x777870);
    }
    if (this.indicator)
      this.indicator.emissiveIntensity =
        this.state.on && this.state.auto ? 1 : 0;
    this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
    UIEventBus.dispatch("screenbarState", { ...this.state });
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* Optional persistence. */
    }
  }

  open() {
    UIEventBus.dispatch("screenbarOpen", { ...this.state });
  }

  private hit(x: number, y: number): ScreenBarAction | "panel" | null {
    const camera = this.desk.app.camera;
    if (
      !this.enabled ||
      camera.inspectionActive ||
      camera.paperActive ||
      camera.targetKeyframe
    )
      return null;
    this.ray.setFromCamera(
      new THREE.Vector2((x / innerWidth) * 2 - 1, (-y / innerHeight) * 2 + 1),
      camera.instance,
    );
    const hit = this.ray
      .intersectObjects(this.desk.app.scene.children, true)
      .find(({ object }) => {
        if (!(object instanceof THREE.Mesh)) return false;
        for (
          let parent: THREE.Object3D | null = object;
          parent;
          parent = parent.parent
        )
          if (!parent.visible) return false;
        return true;
      });
    let object = hit?.object;
    let action: ScreenBarAction | "panel" = "panel";
    while (object) {
      if (object.name.startsWith("Control_"))
        action = object.name.slice(8) as ScreenBarAction;
      if (object === this.group) return action;
      object = object.parent;
    }
    return null;
  }

  private bindEvents() {
    document.addEventListener("loadingScreenDone", () => {
      this.enabled = true;
    });
    document.addEventListener("returningToDoor", () => {
      this.enabled = false;
      this.held = undefined;
    });
    document.addEventListener("screenbarCommand", (e: CustomEvent) =>
      this.command(e.detail.action, e.detail.value),
    );
    document.addEventListener("screenbarRequest", () => this.open());
    const blocked = (e: MouseEvent) =>
      (e.target as HTMLElement).closest?.(
        "[data-desk-ui],button,a,input,[role=dialog]",
      );
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0 || blocked(e)) return;
        const action = this.hit(e.clientX, e.clientY);
        if (!action) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        this.held = {
          action,
          x: e.clientX,
          y: e.clientY,
          next: performance.now() + 450,
          repeated: false,
        };
      },
      true,
    );
    document.addEventListener(
      "pointerup",
      (e) => {
        const held = this.held;
        this.held = undefined;
        if (!held) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (Math.hypot(e.clientX - held.x, e.clientY - held.y) > 12) return;
        if (!held.repeated) {
          if (held.action === "panel") this.open();
          else {
            this.command(held.action);
            this.open();
          }
        }
      },
      true,
    );
    document.addEventListener("pointermove", (e) => {
      if (
        this.held &&
        Math.hypot(e.clientX - this.held.x, e.clientY - this.held.y) > 12
      )
        this.held = undefined;
    });
    document.addEventListener(
      "mousedown",
      (e) => {
        if (!blocked(e) && this.hit(e.clientX, e.clientY)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
    document.addEventListener("pointercancel", () => {
      this.held = undefined;
    });
    window.addEventListener("blur", () => {
      this.held = undefined;
    });
  }

  update() {
    const now = performance.now();
    if (
      this.held &&
      now >= this.held.next &&
      (this.held.action === "brightness" || this.held.action === "temperature")
    ) {
      this.command(this.held.action);
      this.held.repeated = true;
      this.held.next = now + 180;
      this.open();
    }
    if (this.state.on && this.state.auto && now - this.lastAuto > 500) {
      this.lastAuto = now;
      const before = this.state.brightness;
      this.autoDim();
      if (before !== this.state.brightness) {
        this.apply();
        this.save();
      }
    }
    if (this.lastHeight !== this.desk.lift.height) {
      this.lastHeight = this.desk.lift.height;
      this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
    }
  }
}
