import * as THREE from "three";
import Application from "../Application";
import Sizes from "../Utils/Sizes";
import EventEmitter from "../Utils/EventEmitter";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import TWEEN from "@tweenjs/tween.js";
import Renderer from "../Renderer";
import Resources from "../Utils/Resources";
import UIEventBus from "../UI/EventBus";
import Time from "../Utils/Time";
import BezierEasing from "bezier-easing";
import {
  CameraKeyframeInstance,
  MonitorKeyframe,
  IdleKeyframe,
  LoadingKeyframe,
  DeskKeyframe,
  OrbitControlsStart,
} from "./CameraKeyframes";

export enum CameraKey {
  IDLE = "idle",
  MONITOR = "monitor",
  LOADING = "loading",
  ENTRY = "entry",
  DESK = "desk",
  ORBIT_CONTROLS_START = "orbitControlsStart",
}
export default class Camera extends EventEmitter {
  application: Application;
  sizes: Sizes;
  scene: THREE.Scene;
  instance: THREE.PerspectiveCamera;
  renderer: Renderer;
  resources: Resources;
  time: Time;

  position: THREE.Vector3;
  focalPoint: THREE.Vector3;

  paperActive = false;
  inspectionActive = false;
  private doorwayBusy = false;
  private roomEntered = false;
  freeCam: boolean;
  orbitControls: OrbitControls;

  currentKeyframe: CameraKey | undefined;
  targetKeyframe: CameraKey | undefined;
  keyframes: { [key in CameraKey]: CameraKeyframeInstance };

  constructor() {
    super();
    this.application = new Application();
    this.sizes = this.application.sizes;
    this.scene = this.application.scene;
    this.renderer = this.application.renderer;
    this.resources = this.application.resources;
    this.time = this.application.time;

    this.position = new THREE.Vector3(0, 0, 0);
    this.focalPoint = new THREE.Vector3(0, 0, 0);

    this.freeCam = false;

    this.keyframes = {
      idle: new IdleKeyframe(),
      monitor: new MonitorKeyframe(),
      loading: new LoadingKeyframe(),
      entry: new CameraKeyframeInstance({
        position: new THREE.Vector3(-6550, 400, 14100),
        focalPoint: new THREE.Vector3(-4500, 0, 6500),
      }),
      desk: new DeskKeyframe(),
      orbitControlsStart: new OrbitControlsStart(),
    };

    document.addEventListener("mousedown", (event) => {
      if ((event.target as HTMLElement).closest?.("[data-desk-ui]")) return;
      event.preventDefault();
      // @ts-ignore
      if (event.target.id === "prevent-click") return;
      // print target and current keyframe
      if (
        this.currentKeyframe === CameraKey.IDLE ||
        this.targetKeyframe === CameraKey.IDLE
      ) {
        this.transition(CameraKey.DESK);
      } else if (
        this.currentKeyframe === CameraKey.DESK ||
        this.targetKeyframe === CameraKey.DESK
      ) {
        this.transition(CameraKey.IDLE);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.repeat || event.defaultPrevented)
        return;
      const target = event.target as HTMLElement;
      if (
        target.closest?.(
          "input, textarea, select, [contenteditable=true], [role=dialog]",
        )
      )
        return;
      this.returnToDoor();
    });
    this.setPostLoadTransition();
    this.setInstance();
    this.setMonitorListeners();
    this.setFreeCamListeners();
  }

  transition(
    key: CameraKey,
    duration: number = 1000,
    easing?: any,
    callback?: () => void,
  ) {
    if (
      this.inspectionActive ||
      this.paperActive ||
      this.currentKeyframe === key
    )
      return;

    if (this.targetKeyframe) TWEEN.removeAll();

    this.currentKeyframe = undefined;
    this.targetKeyframe = key;

    const keyframe = this.keyframes[key];

    const posTween = new TWEEN.Tween(this.position)
      .to(keyframe.position, duration)
      .easing(easing || TWEEN.Easing.Quintic.InOut)
      .onComplete(() => {
        this.currentKeyframe = key;
        this.targetKeyframe = undefined;
        if (callback) callback();
      });

    const focTween = new TWEEN.Tween(this.focalPoint)
      .to(keyframe.focalPoint, duration)
      .easing(easing || TWEEN.Easing.Quintic.InOut);

    posTween.start();
    focTween.start();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      58,
      this.sizes.width / this.sizes.height,
      100,
      180000,
    );
    this.currentKeyframe = CameraKey.LOADING;

    this.scene.add(this.instance);
  }

  setMonitorListeners() {
    this.on("enterMonitor", () => {
      this.transition(CameraKey.MONITOR, 2000, BezierEasing(0.13, 0.99, 0, 1));
      UIEventBus.dispatch("enterMonitor", {});
    });
    this.on("leftMonitor", () => {
      this.transition(CameraKey.DESK);
      UIEventBus.dispatch("leftMonitor", {});
    });
  }

  setFreeCamListeners() {
    UIEventBus.on("freeCamToggle", (toggle: boolean) => {
      // if (toggle === this.freeCam) return;
      if (toggle) {
        this.transition(
          CameraKey.ORBIT_CONTROLS_START,
          750,
          BezierEasing(0.13, 0.99, 0, 1),
          () => {
            this.instance.position.copy(
              this.keyframes.orbitControlsStart.position,
            );

            this.orbitControls.update();
            this.freeCam = true;
          },
        );
        // @ts-ignore
        document.getElementById("webgl").style.pointerEvents = "auto";
      } else {
        this.freeCam = false;
        this.transition(CameraKey.IDLE, 4000, TWEEN.Easing.Exponential.Out);
        // @ts-ignore
        document.getElementById("webgl").style.pointerEvents = "none";
      }
    });
  }

  setPostLoadTransition() {
    UIEventBus.on("openDoor", () => {
      if (this.doorwayBusy || this.roomEntered) return;
      this.doorwayBusy = true;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.application.world.entrance.open();
      window.setTimeout(
        () => {
          this.transition(
            CameraKey.ENTRY,
            reduced ? 1 : 1800,
            TWEEN.Easing.Cubic.InOut,
            () => {
              this.transition(
                CameraKey.IDLE,
                reduced ? 1 : 2200,
                TWEEN.Easing.Cubic.InOut,
                () => {
                  this.doorwayBusy = false;
                  this.roomEntered = true;
                  UIEventBus.dispatch("loadingScreenDone", {});
                },
              );
            },
          );
        },
        reduced ? 0 : 900,
      );
    });
  }

  returnToDoor() {
    if (
      !this.roomEntered ||
      this.doorwayBusy ||
      this.inspectionActive ||
      this.paperActive ||
      this.freeCam ||
      this.targetKeyframe ||
      this.currentKeyframe !== CameraKey.IDLE
    )
      return;
    this.doorwayBusy = true;
    this.roomEntered = false;
    UIEventBus.dispatch("returningToDoor", {});
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.transition(
      CameraKey.ENTRY,
      reduced ? 1 : 2200,
      TWEEN.Easing.Cubic.InOut,
      () => {
        this.transition(
          CameraKey.LOADING,
          reduced ? 1 : 1800,
          TWEEN.Easing.Cubic.InOut,
          () => {
            this.application.world.entrance.close(() => {
              this.doorwayBusy = false;
              UIEventBus.dispatch("doorClosed", {});
            });
          },
        );
      },
    );
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  createControls() {
    this.renderer = this.application.renderer;
    this.orbitControls = new OrbitControls(
      this.instance,
      this.renderer.instance.domElement,
    );

    const { x, y, z } = this.keyframes.orbitControlsStart.focalPoint;
    this.orbitControls.target.set(x, y, z);

    this.orbitControls.enablePan = false;
    this.orbitControls.enableDamping = true;
    this.orbitControls.object.position.copy(
      this.keyframes.orbitControlsStart.position,
    );
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minPolarAngle = 1.05;
    this.orbitControls.maxPolarAngle = Math.PI / 2;
    this.orbitControls.minAzimuthAngle = -0.65;
    this.orbitControls.maxAzimuthAngle = 0.65;
    this.orbitControls.minDistance = 2500;
    this.orbitControls.maxDistance = 4000;

    this.orbitControls.update();
  }

  update() {
    if (this.paperActive || this.inspectionActive) return;
    TWEEN.update();
    const view = this.targetKeyframe || this.currentKeyframe;
    const roomView =
      this.freeCam ||
      view === CameraKey.IDLE ||
      view === CameraKey.LOADING ||
      view === CameraKey.ENTRY ||
      view === CameraKey.ORBIT_CONTROLS_START;
    const targetFov = roomView
      ? this.sizes.width < this.sizes.height
        ? 70
        : 58
      : 35;
    this.instance.fov += (targetFov - this.instance.fov) * 0.08;

    if (this.freeCam && this.orbitControls) {
      this.position.copy(this.orbitControls.object.position);
      this.focalPoint.copy(this.orbitControls.target);
      this.orbitControls.update();
      return;
    }

    for (const key in this.keyframes) {
      const _key = key as CameraKey;
      this.keyframes[_key].update();
    }

    if (this.currentKeyframe) {
      const keyframe = this.keyframes[this.currentKeyframe];
      this.position.copy(keyframe.position);
      this.focalPoint.copy(keyframe.focalPoint);
    }

    this.instance.position.copy(this.position);
    this.instance.lookAt(this.focalPoint);
  }
}
