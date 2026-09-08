import * as THREE from "three";
import PersonalDesk from "./PersonalDesk";
import UIEventBus from "../UI/EventBus";
import { CameraKey } from "../Camera/Camera";

type Action = "sound" | "camera";

export default class WallControls {
  group = new THREE.Group();
  muted = false;
  exploring = false;
  enabled = false;
  private lastSecond = "";
  private hovered: Action | null = null;
  private pressed: { action: Action; x: number; y: number } | null = null;
  private ray = new THREE.Raycaster();
  private buttons = new Map<
    Action,
    {
      mesh: THREE.Mesh;
      texture: THREE.CanvasTexture;
      ctx: CanvasRenderingContext2D;
    }
  >();
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  constructor(private desk: PersonalDesk) {
    this.group.name = "Workspace wall plaque and controls";
    this.group.position.set(350, 2600, -1950);
    desk.app.scene.add(this.group);
    const wood = desk.material(0xa77a50);
    const cream = desk.material(0xe6d7ba);
    desk.box(2540, 1430, 100, 0, 0, 0, wood, 25, this.group);
    desk.box(2420, 1310, 30, 0, 0, 65, cream, 18, this.group);
    this.canvas.width = 1024;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.encoding = THREE.sRGBEncoding;
    const face = desk.mesh(
      new THREE.PlaneGeometry(2190, 850),
      new THREE.MeshBasicMaterial({ map: this.texture }),
      0,
      175,
      86,
      this.group,
    );
    face.castShadow = false;
    for (const [action, x] of [
      ["sound", -565],
      ["camera", 565],
    ] as const) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext("2d")!;
      const texture = new THREE.CanvasTexture(canvas);
      texture.encoding = THREE.sRGBEncoding;
      desk.box(
        1010,
        290,
        70,
        x,
        -440,
        95,
        desk.material(0x263a35),
        35,
        this.group,
      );
      const mesh = desk.mesh(
        new THREE.PlaneGeometry(920, 220),
        new THREE.MeshBasicMaterial({ map: texture }),
        x,
        -440,
        136,
        this.group,
      );
      mesh.name =
        action === "sound" ? "Toggle room sound" : "Toggle room camera";
      mesh.castShadow = false;
      this.buttons.set(action, { mesh, texture, ctx });
    }
    document.addEventListener("loadingScreenDone", () => {
      this.enabled = true;
    });
    document.addEventListener("returningToDoor", () => {
      this.enabled = false;
      this.setHover(null);
    });
    document.addEventListener("muteToggle", (e) => {
      this.muted = (e as CustomEvent).detail;
      this.paintButtons();
    });
    document.addEventListener("freeCamToggle", (e) => {
      this.exploring = (e as CustomEvent).detail;
      this.paintButtons();
    });
    document.addEventListener("pointermove", (e) =>
      this.setHover(this.hit(e.clientX, e.clientY)),
    );
    document.addEventListener(
      "pointerdown",
      (e) => {
        const action = this.hit(e.clientX, e.clientY);
        if (!action || e.button !== 0) return;
        this.pressed = { action, x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
    document.addEventListener(
      "pointerup",
      (e) => {
        const pressed = this.pressed;
        this.pressed = null;
        if (!pressed) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (
          Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) < 12 &&
          this.hit(e.clientX, e.clientY) === pressed.action
        )
          this.activate(pressed.action);
      },
      true,
    );
    document.addEventListener("pointercancel", () => {
      this.pressed = null;
    });
    document.addEventListener(
      "mousedown",
      (e) => {
        if (this.hit(e.clientX, e.clientY)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || !this.available())
        return;
      if (
        (e.target as HTMLElement).closest?.(
          "input, textarea, select, button, a, [contenteditable], [role=dialog]",
        )
      )
        return;
      const action =
        e.key.toLowerCase() === "m"
          ? "sound"
          : e.key.toLowerCase() === "c"
            ? "camera"
            : null;
      if (action) {
        e.preventDefault();
        this.activate(action);
      }
    });
    this.paintButtons();
    this.update();
  }
  private available() {
    const camera = this.desk.app.camera;
    return (
      this.enabled &&
      !camera.paperActive &&
      !camera.inspectionActive &&
      !camera.targetKeyframe &&
      (camera.freeCam ||
        camera.currentKeyframe === CameraKey.IDLE ||
        camera.currentKeyframe === CameraKey.DESK)
    );
  }
  private hit(x: number, y: number): Action | null {
    if (!this.available()) return null;
    this.ray.setFromCamera(
      new THREE.Vector2((x / innerWidth) * 2 - 1, (-y / innerHeight) * 2 + 1),
      this.desk.app.camera.instance,
    );
    const hit = this.ray.intersectObjects(
      [...this.buttons.values()].map((b) => b.mesh),
    )[0];
    if (!hit) return null;
    return (
      [...this.buttons].find(([, b]) => b.mesh === hit.object)?.[0] || null
    );
  }
  private activate(action: Action) {
    if (!this.available()) return;
    UIEventBus.dispatch(
      action === "sound" ? "muteToggle" : "freeCamToggle",
      action === "sound" ? !this.muted : !this.exploring,
    );
    this.setHover(null);
  }
  private setHover(action: Action | null) {
    if (this.hovered === action) return;
    this.hovered = action;
    document.body.style.cursor = action ? "pointer" : "";
    this.paintButtons();
  }
  private paintButtons() {
    for (const [action, b] of this.buttons) {
      b.ctx.fillStyle = this.hovered === action ? "#c1121f" : "#263a35";
      b.ctx.fillRect(0, 0, 512, 160);
      b.ctx.fillStyle =
        action === "sound" && this.muted ? "#d49473" : "#b7c49c";
      b.ctx.beginPath();
      b.ctx.arc(44, 80, 10, 0, Math.PI * 2);
      b.ctx.fill();
      b.ctx.fillStyle = "#f8e9cc";
      b.ctx.textAlign = "center";
      b.ctx.font = "26px sans-serif";
      b.ctx.fillText(
        action === "sound"
          ? this.muted
            ? "SOUND OFF"
            : "SOUND ON"
          : this.exploring
            ? "DESK VIEW"
            : "LOOK AROUND",
        285,
        70,
      );
      b.ctx.font = "18px sans-serif";
      b.ctx.fillText(
        action === "sound" ? "M · TOGGLE" : "C · TOGGLE",
        285,
        111,
      );
      b.texture.needsUpdate = true;
    }
  }
  update() {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    if (time === this.lastSecond) return;
    this.lastSecond = time;
    const ctx = this.ctx;
    ctx.fillStyle = "#e6d7ba";
    ctx.fillRect(0, 0, 1024, 400);
    ctx.textAlign = "center";
    ctx.fillStyle = "#263a35";
    ctx.font = "64px Georgia";
    ctx.fillText("Connor Love", 512, 105);
    ctx.font = "29px sans-serif";
    ctx.fillText("WEB DEVELOPER", 512, 175);
    ctx.strokeStyle = "#a99a7e";
    ctx.beginPath();
    ctx.moveTo(200, 220);
    ctx.lineTo(824, 220);
    ctx.stroke();
    ctx.font = "48px monospace";
    ctx.fillText(time, 512, 300);
    this.texture.needsUpdate = true;
  }
}
