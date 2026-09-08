import * as THREE from "three";
import PersonalDesk from "./PersonalDesk";

/** Motorized lift: grounded sleeves, moving inner columns, and physical controls. */
export default class StandingDesk {
  height = -650;
  readonly min = -800;
  readonly max = 400;
  readonly presets = [-650, -150, 350];
  target: number | null = null;
  direction = 0;
  velocity = 0;
  enabled = false;
  buttons: THREE.Mesh[] = [];
  private lastTime = performance.now();
  private heldKeys = new Set<string>();
  private pointerDirection = 0;
  private pointerStarted = 0;
  private motor?: GainNode;
  private tones: OscillatorNode[] = [];
  private readout = document.createElement("canvas");
  private display: THREE.CanvasTexture;
  private lastDisplay = "";

  constructor(private desk: PersonalDesk) {
    const panel = new THREE.Group();
    panel.name = "Standing desk controls: hold ↑ / ↓ · presets 1, 2, 3";
    panel.position.set(1260, -130, 947);
    desk.desktop.add(panel);
    desk.box(450, 112, 90, 0, 0, 0, desk.edge, 18, panel);
    this.readout.width = 256;
    this.readout.height = 128;
    this.display = new THREE.CanvasTexture(this.readout);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(106, 55),
      new THREE.MeshBasicMaterial({ map: this.display, toneMapped: false }),
    );
    screen.position.set(-155, 0, 46);
    panel.add(screen);
    ["↑", "↓", "1", "2", "3"].forEach((label, index) => {
      const x = -65 + index * 59;
      const button = desk.box(49, 66, 14, x, 0, 49, desk.black, 9, panel);
      button.name = `Desk ${label}`;
      this.buttons.push(button);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#e8eee8";
      ctx.font = "500 95px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 64, 66);
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy =
        desk.app.renderer.instance.capabilities.getMaxAnisotropy();
      const glyph = new THREE.Mesh(
        new THREE.PlaneGeometry(35, 44),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
        }),
      );
      glyph.position.set(0, 0, 7.2);
      button.add(glyph);
    });
    document.addEventListener("loadingScreenDone", () => {
      this.enabled = true;
    });
    document.addEventListener("returningToDoor", () => {
      this.enabled = false;
      this.stop();
    });
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          !["ArrowUp", "ArrowDown"].includes(event.key) ||
          !this.available() ||
          this.editing(event)
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.heldKeys.add(event.key);
        this.target = null;
        this.startAudio();
      },
      true,
    );
    document.addEventListener(
      "keyup",
      (event) => {
        this.heldKeys.delete(event.key);
      },
      true,
    );
    document.addEventListener(
      "pointerdown",
      (event) => {
        const index = this.hit(event);
        if (index < 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.startAudio();
        this.heldKeys.clear();
        if (index < 2) {
          this.target = null;
          this.pointerStarted = performance.now();
          this.pointerDirection = index === 0 ? 1 : -1;
        } else this.target = this.presets[index - 2];
      },
      true,
    );
    // Suppress the compatibility mouse event before the camera enters the desk.
    document.addEventListener(
      "mousedown",
      (event) => {
        if (this.hit(event) >= 0) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
    window.addEventListener(
      "pointerup",
      () => {
        if (
          this.pointerDirection &&
          performance.now() - this.pointerStarted < 180 &&
          this.available()
        ) {
          this.target = THREE.MathUtils.clamp(
            this.height + this.pointerDirection * 45,
            this.min,
            this.max,
          );
        }
        this.pointerDirection = 0;
      },
      true,
    );
    window.addEventListener("pointercancel", () => this.stop());
    window.addEventListener("blur", () => this.stop());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
    });
    this.applyHeight();
  }

  private editing(event: KeyboardEvent) {
    return (
      (event as KeyboardEvent & { inComputer?: boolean }).inComputer ||
      (event.target as HTMLElement)?.closest?.(
        'input, textarea, select, [contenteditable="true"], iframe, [role="dialog"]',
      )
    );
  }

  private available() {
    const camera = this.desk.app.camera;
    return (
      this.enabled &&
      !camera.targetKeyframe &&
      !camera.inspectionActive &&
      !camera.paperActive &&
      ["idle", "desk"].includes(camera.currentKeyframe)
    );
  }

  private hit(event: MouseEvent) {
    if (
      !this.available() ||
      (event.target as HTMLElement)?.closest?.("button, [data-desk-ui], iframe")
    )
      return -1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        (event.clientX / innerWidth) * 2 - 1,
        1 - (event.clientY / innerHeight) * 2,
      ),
      this.desk.app.camera.instance,
    );
    const hits = ray.intersectObjects(this.desk.app.scene.children, true);
    for (const hit of hits) {
      let object: THREE.Object3D | null = hit.object;
      while (object) {
        const index = this.buttons.indexOf(object as THREE.Mesh);
        if (index >= 0) return index;
        object = object.parent;
      }
      const material = (hit.object as THREE.Mesh).material as THREE.Material;
      if (
        hit.object.visible &&
        material &&
        !(material.transparent && material.opacity < 0.1)
      )
        return -1;
    }
    return -1;
  }

  private startAudio() {
    const audio = this.desk.app.world.audioManager;
    if (!audio) return;
    void audio.context.resume().catch(() => {});
    if (this.motor) return;
    this.motor = audio.context.createGain();
    this.motor.gain.value = 0;
    this.motor.connect(audio.listener.getInput());
    // Low gearbox hum plus the quiet higher electric motor whine.
    [86, 172, 344].forEach((frequency, index) => {
      const tone = audio.context.createOscillator();
      tone.type = index === 0 ? "triangle" : "sine";
      tone.frequency.value = frequency;
      const gain = audio.context.createGain();
      gain.gain.value = [0.6, 0.22, 0.07][index];
      tone.connect(gain).connect(this.motor!);
      tone.start();
      this.tones.push(tone);
    });
  }

  private stop() {
    this.target = null;
    this.pointerDirection = 0;
    this.heldKeys.clear();
    this.direction = 0;
    this.velocity = 0;
  }

  private applyHeight() {
    this.desk.desktop.position.y = this.height;
    // The inner section always overlaps the fixed sleeve and meets the desktop.
    const top = this.height - 65;
    const bottom = -1900;
    for (const column of this.desk.columns) {
      column.position.y = (top + bottom) / 2;
      column.scale.y = (top - bottom) / 1000;
    }
    const label = ((2310 + this.height) / (22.5 * 2.54)).toFixed(1);
    if (label !== this.lastDisplay) {
      const ctx = this.readout.getContext("2d")!;
      ctx.fillStyle = "#10191a";
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = "#b9e6e2";
      ctx.font = "64px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, 128, 76);
      ctx.font = "22px monospace";
      ctx.fillText("in", 128, 108);
      this.display.needsUpdate = true;
      this.lastDisplay = label;
    }
    this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
  }

  update() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    if (!this.available()) this.stop();
    this.direction =
      this.pointerDirection ||
      Number(this.heldKeys.has("ArrowUp")) -
        Number(this.heldKeys.has("ArrowDown"));
    const desired =
      this.target === null
        ? this.direction
        : Math.sign(this.target - this.height);
    this.velocity = THREE.MathUtils.lerp(
      this.velocity,
      desired * 180,
      1 - Math.exp(-dt * 12),
    );
    if (!desired && Math.abs(this.velocity) < 0.5) this.velocity = 0;
    let next = THREE.MathUtils.clamp(
      this.height + this.velocity * dt,
      this.min,
      this.max,
    );
    if (
      this.target !== null &&
      (this.target - this.height) * (this.target - next) <= 0
    ) {
      next = this.target;
      this.target = null;
      this.velocity = 0;
    }
    const moved = Math.abs(next - this.height) > 0.001;
    if (moved) {
      this.height = next;
      this.applyHeight();
    } else if (next === this.min || next === this.max) this.velocity = 0;
    this.buttons.forEach((button, index) => {
      const active =
        index < 2
          ? this.direction === (index === 0 ? 1 : -1)
          : this.target === this.presets[index - 2];
      button.position.z = active ? 46 : 49;
    });
    if (this.motor) {
      const context = this.desk.app.world.audioManager.context;
      this.motor.gain.setTargetAtTime(
        moved ? 0.07 * Math.min(1, Math.abs(this.velocity) / 180) : 0,
        context.currentTime,
        0.06,
      );
      this.tones.forEach((tone, index) =>
        tone.frequency.setTargetAtTime(
          [86, 172, 344][index] * (0.85 + Math.abs(this.velocity) / 1200),
          context.currentTime,
          0.08,
        ),
      );
    }
  }
}
