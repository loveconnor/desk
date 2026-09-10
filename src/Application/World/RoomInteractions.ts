import * as THREE from "three";
import Application from "../Application";
import { CameraKey } from "../Camera/Camera";
import UIEventBus from "../UI/EventBus";

export interface RoomDetail {
  title: string;
  subtitle: string;
  body: string;
  showDescription?: boolean;
  image?: string;
  href?: string;
}
export default class RoomInteractions {
  targets = new Map<THREE.Object3D, { label: string; action: () => void }>();
  enabled = false;
  held: THREE.Object3D | null = null;
  private returning = false;
  private moving = false;
  private returnRequested = false;
  private home: {
    parent: THREE.Object3D;
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    scale: THREE.Vector3;
  } | null = null;
  private dragX: number | null = null;
  private angle = 0;
  private pressed: { object: THREE.Object3D; x: number; y: number } | null =
    null;
  private ray = new THREE.Raycaster();
  constructor(private app: Application) {
    document.addEventListener("putBackRoomObject", () => this.putBack());
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && this.held) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.putBack();
        }
      },
      true,
    );
    document.addEventListener("loadingScreenDone", () => {
      this.enabled = true;
    });
    document.addEventListener("returningToDoor", () => {
      this.enabled = false;
    });
    document.addEventListener(
      "pointerdown",
      (e) => {
        if ((e.target as HTMLElement).closest?.("[data-desk-ui]")) return;
        if (this.held) {
          this.dragX = e.clientX;
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        const object = this.hit(e.clientX, e.clientY);
        if (!object || e.button !== 0) return;
        this.pressed = { object, x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
    document.addEventListener(
      "pointerup",
      (e) => {
        if ((e.target as HTMLElement).closest?.("[data-desk-ui]")) return;
        if (this.held) {
          this.dragX = null;
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        const pressed = this.pressed;
        this.pressed = null;
        if (!pressed) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (
          Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) < 12 &&
          this.hit(e.clientX, e.clientY) === pressed.object
        )
          this.targets.get(pressed.object)?.action();
      },
      true,
    );
    document.addEventListener("pointercancel", () => {
      this.pressed = null;
    });
    document.addEventListener(
      "mousedown",
      (e) => {
        if ((e.target as HTMLElement).closest?.("[data-desk-ui]")) return;
        if (this.hit(e.clientX, e.clientY)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
    document.addEventListener("pointermove", (e) => {
      if (this.held && !this.moving && !this.returning && this.dragX !== null) {
        this.angle += (e.clientX - this.dragX) * 0.008;
        this.dragX = e.clientX;
        this.held.quaternion
          .copy(this.app.camera.instance.quaternion)
          .multiply(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 1, 0),
              this.angle,
            ),
          );
        this.app.renderer.instance.shadowMap.needsUpdate = true;
      }
      const object = this.hit(e.clientX, e.clientY);
      this.app.renderer.instance.domElement.style.cursor = object
        ? "pointer"
        : "";
      document.documentElement.style.cursor = object ? "pointer" : "";
    });
  }
  add(object: THREE.Object3D, label: string, action: () => void) {
    object.name = label;
    this.targets.set(object, { label, action });
  }
  inspect(object: THREE.Object3D, detail: RoomDetail) {
    this.pickup(object, detail);
  }
  pickup(
    object: THREE.Object3D,
    detail: RoomDetail,
    width = 470,
    height = 470,
  ) {
    this.add(object, detail.title, () => {
      if (this.held || !object.parent) return;
      object.traverse((child) => {
        const material = (child as THREE.Mesh).material;
        for (const entry of Array.isArray(material) ? material : [material]) {
          const map = (entry as THREE.MeshBasicMaterial | undefined)?.map;
          map?.userData.ensureHighResolution?.().catch(console.error);
        }
      });
      this.app.camera.inspectionActive = true;
      this.held = object;
      this.angle = 0;
      this.home = {
        parent: object.parent,
        position: object.position.clone(),
        quaternion: object.quaternion.clone(),
        scale: object.scale.clone(),
      };
      this.app.scene.attach(object);
      const camera = this.app.camera.instance;
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const distance = Math.max(
        height / (2 * tan * 0.68),
        width / (2 * tan * camera.aspect * 0.75),
        350,
      );
      const target = new THREE.Vector3(0, 40, -distance)
        .applyQuaternion(camera.quaternion)
        .add(camera.position);
      this.animate(object, target, camera.quaternion.clone(), () => {
        if (this.returnRequested) this.putBack();
      });
      UIEventBus.dispatch("inspectRoomObject", detail);
    });
  }
  private animate(
    object: THREE.Object3D,
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    done: () => void,
  ) {
    this.moving = true;
    const start = performance.now(),
      from = object.position.clone(),
      rotation = object.quaternion.clone();
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 950;
    const frame = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const ease = t * t * (3 - 2 * t);
      object.position.lerpVectors(from, position, ease);
      object.quaternion.slerpQuaternions(rotation, quaternion, ease);
      this.app.renderer.instance.shadowMap.needsUpdate = true;
      if (t < 1) requestAnimationFrame(frame);
      else {
        this.moving = false;
        done();
      }
    };
    requestAnimationFrame(frame);
  }
  putBack() {
    if (!this.held || !this.home || this.returning) return;
    if (this.moving) {
      this.returnRequested = true;
      return;
    }
    this.returnRequested = false;
    this.returning = true;
    const object = this.held,
      home = this.home;
    home.parent.updateWorldMatrix(true, false);
    const target = home.parent.localToWorld(home.position.clone());
    const rotation = home.parent
      .getWorldQuaternion(new THREE.Quaternion())
      .multiply(home.quaternion);
    this.animate(object, target, rotation, () => {
      home.parent.add(object);
      object.position.copy(home.position);
      object.quaternion.copy(home.quaternion);
      object.scale.copy(home.scale);
      object.traverse((child) => {
        const material = (child as THREE.Mesh).material;
        for (const entry of Array.isArray(material) ? material : [material]) {
          const map = (entry as THREE.MeshBasicMaterial | undefined)?.map;
          map?.userData.releaseHighResolution?.().catch(console.error);
        }
      });
      this.held = null;
      this.home = null;
      this.returning = false;
      this.dragX = null;
      this.app.camera.inspectionActive = false;
      this.app.renderer.instance.shadowMap.needsUpdate = true;
      UIEventBus.dispatch("roomObjectReturned", {});
    });
  }
  private hit(x: number, y: number) {
    const camera = this.app.camera;
    if (
      !this.enabled ||
      camera.inspectionActive ||
      camera.paperActive ||
      camera.targetKeyframe ||
      (!camera.freeCam &&
        camera.currentKeyframe !== CameraKey.IDLE &&
        camera.currentKeyframe !== CameraKey.DESK)
    )
      return null;
    this.ray.setFromCamera(
      new THREE.Vector2((x / innerWidth) * 2 - 1, (-y / innerHeight) * 2 + 1),
      camera.instance,
    );
    // Test the nearest visible surface, so objects cannot be clicked through furniture.
    const hit = this.ray
      .intersectObjects(this.app.scene.children, true)
      .find(
        (h) =>
          h.object instanceof THREE.Mesh &&
          (h.object.material as THREE.Material).visible !== false,
      );
    let object: THREE.Object3D | null = hit?.object || null;
    while (object) {
      if (this.targets.has(object)) return object;
      object = object.parent;
    }
    return null;
  }
}
