import CityExterior from "./CityExterior";
import * as THREE from "three";
import PersonalDesk from "./PersonalDesk";
import Room from "./Room";

/** Solar altitude at NYC, using NOAA's fractional-year approximation (UTC input). */
export function nycSun(date: Date) {
  const day =
    (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000;
  const g = ((2 * Math.PI) / 365.2425) * day;
  const equation =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));
  const dec =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const minutes =
    date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const angle = THREE.MathUtils.degToRad(
    (minutes + equation - 74.006 * 4) / 4 - 180,
  );
  const lat = THREE.MathUtils.degToRad(40.7128);
  return {
    altitude: Math.asin(
      Math.sin(lat) * Math.sin(dec) +
        Math.cos(lat) * Math.cos(dec) * Math.cos(angle),
    ),
    angle,
    // South-facing window: +X east, +Y up, -Z toward the exterior.
    direction: new THREE.Vector3(
      -Math.cos(dec) * Math.sin(angle),
      Math.sin(lat) * Math.sin(dec) +
        Math.cos(lat) * Math.cos(dec) * Math.cos(angle),
      -(
        Math.sin(lat) * Math.cos(dec) * Math.cos(angle) -
        Math.cos(lat) * Math.sin(dec)
      ),
    ),
  };
}

export default class RoomWindow {
  coverage = 0;
  target = 0;
  daylight = 1;
  /** Explicit date override for deterministic visual checks; normal use follows the clock. */
  dateOverride: Date | null = null;
  slats: THREE.Mesh[] = [];
  private group = new THREE.Group();
  private outside = new THREE.Group();
  private rail: THREE.Mesh;
  private hitPlane: THREE.Mesh;
  private light = new THREE.PointLight(0xffdda0, 0.65, 8500, 2);
  city: CityExterior;
  private cords: THREE.Mesh[] = [];
  private drag: {
    id: number;
    y: number;
    coverage: number;
    worldY: number;
    moved: boolean;
    frozen: boolean;
  } | null = null;
  private exteriorMaterials: THREE.MeshBasicMaterial[] = [];
  private exteriorColors: THREE.Color[] = [];
  private night = { value: 0 };
  private collectedExtras = false;
  private bounce = new THREE.AmbientLight(0xffcc99, 0);
  private last = performance.now();
  private lightingKey = "";
  private enabled = false;
  private basics = new Map<THREE.MeshBasicMaterial, THREE.Color>();

  constructor(
    private desk: PersonalDesk,
    private room: Room,
  ) {
    this.group.name =
      "Blackout blinds — drag to lower, click to close or reopen";
    room.group.add(this.group);
    desk.app.scene.add(this.outside);
    this.outside.name = "NYC skyline with depth and exterior window trim";
    const linen = desk.material(0xe8d8bc);
    desk.box(
      2350,
      100,
      180,
      -2600,
      2300,
      -1830,
      desk.material(0xa77b52),
      8,
      this.group,
    );
    for (let i = 0; i < 48; i++) {
      this.slats.push(
        desk.box(
          2300,
          48,
          54,
          -2600,
          2190 - i * 4,
          -1800,
          linen,
          3,
          this.group,
        ),
      );
    }
    this.rail = desk.box(
      2330,
      65,
      90,
      -2600,
      1960,
      -1780,
      linen,
      8,
      this.group,
    );
    for (const x of [-3390, -1810]) {
      this.cords.push(
        desk.box(
          8,
          220,
          8,
          x,
          2100,
          -1760,
          desk.material(0xc3b69e),
          2,
          this.group,
        ),
      );
    }
    this.hitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2360, 2300),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.hitPlane.position.set(-2600, 1100, -1730);
    this.group.add(this.hitPlane);
    this.city = new CityExterior(desk);
    // Deep masonry reveal and a narrow exterior rail give the window real parallax.
    const stone = desk.material(0x88847f);
    desk.box(2500, 130, 700, -2600, -160, -2400, stone, 8, this.outside);
    const iron = desk.material(0x272e31, 0.5);
    desk.box(2700, 30, 35, -2600, 110, -2840, iron, 4, this.outside);
    for (let i = 0; i < 11; i++)
      desk.box(18, 340, 18, -3850 + i * 250, -60, -2840, iron, 3, this.outside);
    this.light.position.set(-2800, 1800, -1300);
    room.group.add(this.light);
    room.group.add(this.bounce);
    room.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object === this.hitPlane) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const m of materials)
        if (m instanceof THREE.MeshBasicMaterial)
          this.basics.set(m, m.color.clone());
    });
    document.addEventListener("loadingScreenDone", () => {
      this.enabled = true;
    });
    document.addEventListener("returningToDoor", () => {
      this.enabled = false;
      this.release();
    });
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0 || !this.available() || !this.hit(e)) return;
        this.drag = {
          id: e.pointerId,
          y: e.clientY,
          coverage: this.coverage,
          worldY: this.worldY(e),
          moved: false,
          frozen: this.desk.app.camera.inspectionActive,
        };
        this.desk.app.camera.inspectionActive = true;
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
    document.addEventListener(
      "mousedown",
      (e) => {
        if (this.drag) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
    document.addEventListener(
      "pointermove",
      (e) => {
        if (!this.drag || this.drag.id !== e.pointerId) return;
        if (Math.abs(e.clientY - this.drag.y) > 5) this.drag.moved = true;
        if (this.drag.moved)
          this.target = THREE.MathUtils.clamp(
            this.drag.coverage + (this.drag.worldY - this.worldY(e)) / 1980,
            0,
            1,
          );
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
    document.addEventListener(
      "pointerup",
      (e) => {
        if (!this.drag || this.drag.id !== e.pointerId) return;
        if (!this.drag.moved) this.target = this.coverage > 0.95 ? 0 : 1;
        this.release();
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
    window.addEventListener("pointercancel", () => this.release());
    window.addEventListener("blur", () => this.release());
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && this.drag) {
          this.release();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
    this.update();
  }
  private release() {
    if (this.drag) this.desk.app.camera.inspectionActive = this.drag.frozen;
    this.drag = null;
  }
  private available() {
    const c = this.desk.app.camera;
    return (
      this.enabled &&
      !c.targetKeyframe &&
      !c.inspectionActive &&
      !c.paperActive &&
      ["idle", "desk"].includes(c.currentKeyframe)
    );
  }
  private ray(e: MouseEvent) {
    const r = new THREE.Raycaster();
    r.setFromCamera(
      new THREE.Vector2(
        (e.clientX / innerWidth) * 2 - 1,
        1 - (e.clientY / innerHeight) * 2,
      ),
      this.desk.app.camera.instance,
    );
    return r;
  }
  private hit(e: MouseEvent) {
    if ((e.target as HTMLElement).closest?.("button,iframe,[data-desk-ui]"))
      return false;
    const hit = this.ray(e).intersectObject(this.hitPlane)[0];
    // Only the currently deployed blind and its bottom rail are draggable.
    return !!hit && hit.point.y >= this.rail.position.y - 80;
  }
  private worldY(e: MouseEvent) {
    const point = new THREE.Vector3();
    return (
      this.ray(e).ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 1730),
        point,
      )?.y ??
      this.drag?.worldY ??
      0
    );
  }
  update() {
    if (!this.collectedExtras && this.desk.app.world.wallControls) {
      for (const root of [
        this.desk.desktop,
        this.desk.app.world.wallControls.group,
      ])
        root.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            if (
              material instanceof THREE.MeshBasicMaterial &&
              !this.basics.has(material)
            )
              this.basics.set(material, material.color.clone());
          }
        });
      this.collectedExtras = true;
    }
    const now = performance.now(),
      dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    const before = this.coverage;
    this.coverage = THREE.MathUtils.damp(
      this.coverage,
      this.target,
      this.drag ? 25 : 4,
      dt,
    );
    if (Math.abs(this.coverage - this.target) < 0.0005)
      this.coverage = this.target;
    // The sun only needs a new sample each second. Blinds and lamp controls
    // still update on every animation frame while their state changes.
    const date = this.dateOverride ?? new Date();
    const sample = this.dateOverride
      ? date.getTime()
      : Math.floor(date.getTime() / 1000);
    const lightingKey = `${sample}:${this.coverage}:${this.room.lampOn}:${this.room.lights.revision}:${this.basics.size}:${this.city.ready}`;
    if (
      Math.abs(before - this.coverage) > 0.0001 ||
      Math.floor(now / 15000) !== Math.floor((now - dt * 1000) / 15000)
    )
      this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
    if (lightingKey === this.lightingKey) return;
    this.lightingKey = lightingKey;
    const spacing = 4 + this.coverage * 41.6;
    this.slats.forEach((slat, i) => {
      slat.position.y = 2190 - i * spacing;
    });
    this.rail.position.y = 2190 - 47 * spacing - 40;
    this.cords.forEach((cord) => {
      const length = 2220 - this.rail.position.y;
      cord.scale.y = length / 220;
      cord.position.y = 2220 - length / 2;
    });
    const sun = nycSun(date);
    const altitude = THREE.MathUtils.radToDeg(sun.altitude);
    this.daylight = THREE.MathUtils.smoothstep(altitude, -7, 35);
    const transmission = Math.pow(1 - this.coverage, 1.7);
    const light = this.daylight * transmission;
    // Preserve nighttime detail with indirect indoor fill. The sky and direct
    // sunlight still follow the real sun; closing blinds in daylight stays dark.
    const nightFill = (1 - this.daylight) * 0.09 * this.room.lights.indoorFill;
    const reflected = this.room.lampOn ? 0.018 : 0.004;
    const slatLeak = this.daylight * (1 - transmission) * 0.004;
    this.desk.daylight.intensity =
      0.012 + nightFill + light * 0.156 + (1 - light) * reflected + slatLeak;
    // Cast through the real opening. The frame, sill, blinds and furniture
    // occlude this light on every receiving surface, including the woven rug.
    // Also attenuate the room's directional source by the exposed aperture.
    // Shadow maps alone cannot reliably seal the thin blackout slats.
    const sunlight = this.desk.sunlight;
    sunlight.intensity =
      THREE.MathUtils.smoothstep(sun.direction.y, 0, 0.12) *
      THREE.MathUtils.smoothstep(-sun.direction.z, 0, 0.12) *
      0.85 * transmission;
    sunlight.color.setHex(altitude < 15 ? 0xffc28a : 0xfff7e8);
    // Center shadow coverage on the full floor, avoiding an unshadowed border.
    sunlight.target.position.set(-4450, -2313, 7022.5);
    sunlight.position
      .copy(sunlight.target.position)
      .addScaledVector(sun.direction, 22000);
    this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
    this.light.intensity = light * 0.9;
    this.bounce.intensity = this.room.lampOn
      ? 0.03 + (1 - this.daylight) * 0.05
      : 0;
    this.night.value = 1 - this.daylight;
    this.exteriorMaterials.forEach((material, i) =>
      material.color
        .copy(this.exteriorColors[i])
        .multiplyScalar(0.045 + 0.955 * this.daylight),
    );
    this.city.update(this.daylight);
    const glow = roomBrightness(light, this.room.lampOn);
    this.basics.forEach((color, material) =>
      material.color.copy(color).multiplyScalar(glow),
    );
  }
}
function roomBrightness(daylight: number, lamp: boolean) {
  return Math.max(0.008, Math.min(1, daylight + (lamp ? 0.14 : 0)));
}
