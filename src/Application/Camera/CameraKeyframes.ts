import { DESK_WALL_OFFSET_Z } from "../World/deskLayout";
import * as THREE from "three";
import { CameraKey } from "./Camera";
import Time from "../Utils/Time";
import Application from "../Application";
import Mouse from "../Utils/Mouse";
import Sizes from "../Utils/Sizes";

export class CameraKeyframeInstance {
  position: THREE.Vector3;
  focalPoint: THREE.Vector3;

  constructor(keyframe: CameraKeyframe) {
    this.position = keyframe.position;
    this.focalPoint = keyframe.focalPoint;
  }

  update() {}
}

const keys: { [key in CameraKey]: CameraKeyframe } = {
  idle: {
    position: new THREE.Vector3(-6500, 5000, 7500),
    focalPoint: new THREE.Vector3(0, -400, 200),
  },
  monitor: {
    position: new THREE.Vector3(0, 950, 2000),
    focalPoint: new THREE.Vector3(0, 950, 0),
  },
  desk: {
    position: new THREE.Vector3(0, 1100, 4000),
    focalPoint: new THREE.Vector3(0, 500, 0),
  },
  loading: {
    position: new THREE.Vector3(-6150, 500, 23200),
    focalPoint: new THREE.Vector3(-6550, -160, 16135),
  },
  entry: {
    position: new THREE.Vector3(-6550, 400, 14100),
    focalPoint: new THREE.Vector3(-4500, 0, 6500),
  },
  orbitControlsStart: {
    position: new THREE.Vector3(-2200, 1400, 3200),
    focalPoint: new THREE.Vector3(-100, 350, 0),
  },
};

// Translate desk-relative views with the entire workstation.
for (const key of ["monitor", "desk", "orbitControlsStart"] as const) {
  keys[key].position.z += DESK_WALL_OFFSET_Z;
  keys[key].focalPoint.z += DESK_WALL_OFFSET_Z;
}

export class MonitorKeyframe extends CameraKeyframeInstance {
  application: Application;
  sizes: Sizes;
  targetPos: THREE.Vector3;
  origin: THREE.Vector3;

  constructor() {
    const keyframe = keys.monitor;
    super(keyframe);
    this.application = new Application();
    this.sizes = this.application.sizes;
    this.origin = new THREE.Vector3().copy(keyframe.position);
    this.targetPos = new THREE.Vector3().copy(keyframe.position);
  }

  update() {
    this.focalPoint.y =
      950 + (this.application.world?.computerSetup?.lift?.height ?? 0);
    const aspect = this.sizes.height / this.sizes.width;
    this.targetPos.z =
      Math.max(1012, 1800 * aspect) /
        (2 * Math.tan(THREE.MathUtils.degToRad(17.5))) -
      260 +
      180 + DESK_WALL_OFFSET_Z;
    this.position.copy(this.targetPos);
    this.position.y += this.application.world?.computerSetup?.lift?.height ?? 0;
  }
}

export class LoadingKeyframe extends CameraKeyframeInstance {
  constructor() {
    const keyframe = keys.loading;
    super(keyframe);
  }

  update() {}
}

export class DeskKeyframe extends CameraKeyframeInstance {
  origin: THREE.Vector3;
  application: Application;
  mouse: Mouse;
  sizes: Sizes;
  targetFoc: THREE.Vector3;
  targetPos: THREE.Vector3;

  constructor() {
    const keyframe = keys.desk;
    super(keyframe);
    this.application = new Application();
    this.mouse = this.application.mouse;
    this.sizes = this.application.sizes;
    this.origin = new THREE.Vector3().copy(keyframe.position);
    this.targetFoc = new THREE.Vector3().copy(keyframe.focalPoint);
    this.targetPos = new THREE.Vector3().copy(keyframe.position);
  }

  update() {
    // Keep the close camera inside the room, with bounded pointer parallax.
    const pointerX = Math.max(
      -1,
      Math.min(1, (this.mouse.x / this.sizes.width) * 2 - 1),
    );
    const pointerY = Math.max(
      -1,
      Math.min(1, (this.mouse.y / this.sizes.height) * 2 - 1),
    );
    this.targetFoc.lerp(
      new THREE.Vector3(pointerX * 160, 650 - pointerY * 100, DESK_WALL_OFFSET_Z),
      0.05,
    );
    this.targetPos.lerp(
      new THREE.Vector3(
        pointerX * 180,
        this.origin.y - pointerY * 120,
        this.origin.z,
      ),
      0.025,
    );

    this.focalPoint.copy(this.targetFoc);
    this.focalPoint.y +=
      this.application.world?.computerSetup?.lift?.height ?? 0;
    this.position.copy(this.targetPos);
  }
}

export class IdleKeyframe extends CameraKeyframeInstance {
  time: Time;
  origin: THREE.Vector3;

  constructor() {
    const keyframe = keys.idle;
    super(keyframe);
    this.origin = new THREE.Vector3().copy(keyframe.position);
    this.time = new Time();
  }

  update() {
    // Elevated three-quarter view, surrounded by the extended room.
    this.position.set(
      this.origin.x + Math.sin(this.time.elapsed * 0.00008) * 65,
      this.origin.y,
      this.origin.z,
    );
  }
}

export class OrbitControlsStart extends CameraKeyframeInstance {
  constructor() {
    const keyframe = keys.orbitControlsStart;
    super(keyframe);
  }

  update() {}
}
