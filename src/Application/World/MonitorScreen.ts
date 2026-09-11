import { MONITOR } from "./monitorLayout";
import { DESK_WALL_OFFSET_Z } from "./deskLayout";
import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import GUI from "lil-gui";
import Application from "../Application";
import Debug from "../Utils/Debug";
import Resources from "../Utils/Resources";
import Sizes from "../Utils/Sizes";
import Camera, { CameraKey } from "../Camera/Camera";
import EventEmitter from "../Utils/EventEmitter";

const SCREEN_SIZE = { w: MONITOR.screenWidth, h: MONITOR.screenHeight };
const IFRAME_PADDING = 0;
const IFRAME_SIZE = {
  w: SCREEN_SIZE.w - IFRAME_PADDING,
  h: SCREEN_SIZE.h - IFRAME_PADDING,
};

export default class MonitorScreen extends EventEmitter {
  movingSurfaces: THREE.Object3D[] = [];
  appliedHeight = 0;
  application: Application;
  scene: THREE.Scene;
  cssScene: THREE.Scene;
  resources: Resources;
  debug: Debug;
  sizes: Sizes;
  debugFolder: GUI;
  screenSize: THREE.Vector2;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  camera: Camera;
  inComputer: boolean;
  dimmingPlane: THREE.Mesh;
  videoTextures: { [key in string]: THREE.VideoTexture };
  private entryButton: HTMLButtonElement;

  constructor() {
    super();
    this.application = new Application();
    this.scene = this.application.scene;
    this.cssScene = this.application.cssScene;
    this.sizes = this.application.sizes;
    this.resources = this.application.resources;
    this.screenSize = new THREE.Vector2(SCREEN_SIZE.w, SCREEN_SIZE.h);
    this.camera = this.application.camera;
    this.position = new THREE.Vector3(
      0,
      MONITOR.screenY,
      MONITOR.z + DESK_WALL_OFFSET_Z,
    );
    this.rotation = new THREE.Euler(0, 0, 0);
    this.videoTextures = {};

    // Create screen
    this.initializeScreenEvents();
    this.createIframe();
    const maxOffset = this.createTextureLayers();
    // The bezel and native browser surface share one flat aperture.
    this.createPerspectiveDimmer(maxOffset);
    this.createScreenGlow();
  }

  private createScreenGlow() {
    // A broad, soft source spills forward from the display onto the workspace.
    // Limited range keeps it off the far walls and floor without another shadow map.
    const glow = new THREE.SpotLight(0xc5ddff, 0.9, 3000, 1.1, 1, 2);
    glow.name = "Monitor screen glow";
    glow.position.copy(this.position).add(new THREE.Vector3(0, 0, 70));
    glow.target.position.copy(this.position).add(new THREE.Vector3(0, -1000, 1100));
    this.scene.add(glow, glow.target);
    this.movingSurfaces.push(glow, glow.target);
  }

  initializeScreenEvents() {
    // Forward desktop input without letting pointer entry/exit move the camera.
    for (const type of ["mousemove", "mousedown", "mouseup"]) {
      document.addEventListener(type, (event: MouseEvent & { inComputer?: boolean }) => {
        this.inComputer = !!event.inComputer || (event.target as HTMLElement).id === "computer-screen";
        this.application.mouse.trigger(type, [event]);
      });
    }
  }

  /**
   * Creates the iframe for the computer screen
   */
  createIframe() {
    // Create container
    const container = document.createElement("div");
    container.style.width = this.screenSize.width + "px";
    container.style.height = this.screenSize.height + "px";
    container.style.opacity = "1";
    container.style.background = "#1d2e2f";
    container.style.position = "relative";

    // Create iframe
    const iframe = document.createElement("iframe");

    // Bubble mouse move events to the main application, so we can affect the camera
    iframe.onload = () => {
      if (iframe.contentWindow) {
        window.addEventListener("message", (event) => {
          if (
            event.origin !== window.location.origin ||
            (event.source !== iframe.contentWindow && event.source !== window)
          )
            return;
          if (
            ![
              "mousemove",
              "mousedown",
              "mouseup",
              "keydown",
              "keyup",
              "keyboard-reset",
            ].includes(event.data?.type)
          )
            return;
          var evt = new CustomEvent(event.data.type, {
            bubbles: true,
            cancelable: false,
          });

          // @ts-ignore
          evt.inComputer = true;
          if (event.data.type === "mousemove") {
            var clRect = iframe.getBoundingClientRect();
            const { top, left, width, height } = clRect;
            const widthRatio = width / IFRAME_SIZE.w;
            const heightRatio = height / IFRAME_SIZE.h;

            // @ts-ignore
            evt.clientX = Math.round(event.data.clientX * widthRatio + left);
            //@ts-ignore
            evt.clientY = Math.round(event.data.clientY * heightRatio + top);
          } else if (
            event.data.type === "keydown" ||
            event.data.type === "keyup"
          ) {
            Object.assign(evt, {
              key: event.data.key,
              code: event.data.code,
              repeat: event.data.repeat,
            });
          }

          iframe.dispatchEvent(evt);
        });
      }
    };

    // Serve the desktop from the same Vite build and origin.
    iframe.src = "/desktop.html";

    iframe.style.width = this.screenSize.width + "px";
    iframe.style.height = this.screenSize.height + "px";
    iframe.style.padding = IFRAME_PADDING + "px";
    iframe.style.boxSizing = "border-box";
    iframe.style.opacity = "1";
    iframe.style.display = "block";
    iframe.id = "computer-screen";
    iframe.frameBorder = "0";
    iframe.title = "Connor Love Desktop";

    // Add iframe to container
    container.appendChild(iframe);

    // The distant iframe used to consume clicks before the room camera could
    // respond. A projected button owns the first click, then yields to the live
    // desktop once the approach finishes. It also supports touch and keyboard.
    const entry = document.createElement("button");
    entry.type = "button";
    entry.setAttribute("aria-label", "Use computer");
    entry.dataset.roomHint = "Use computer";
    Object.assign(entry.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
      border: "0", padding: "0", background: "transparent", cursor: "pointer",
    });
    entry.addEventListener("click", () => this.camera.openMonitor());
    container.appendChild(entry);
    this.entryButton = entry;

    // Create CSS plane
    this.createCssPlane(container);
  }

  /**
   * Creates a CSS plane and GL plane to properly occlude the CSS plane
   * @param element the element to create the css plane for
   */
  createCssPlane(element: HTMLElement) {
    // Preserve native text rendering and input on one unfiltered browser plane.
    // Rasterize at twice the scene resolution before CSS perspective projection.
    element.style.width = this.screenSize.width * 2 + "px";
    element.style.height = this.screenSize.height * 2 + "px";
    (element.querySelector("iframe")! as HTMLIFrameElement).style.setProperty(
      "zoom",
      "2",
    );
    const object = new CSS3DObject(element);
    object.scale.setScalar(0.5);
    object.position.copy(this.position);
    this.cssScene.add(object);
    this.application.renderer.cssInstance.domElement.firstElementChild!.appendChild(
      element,
    );
    this.movingSurfaces.push(object);
    const hole = new THREE.Mesh(
      this.screenGeometry(),
      new THREE.MeshBasicMaterial({
        color: 0,
        transparent: true,
        opacity: 0,
        blending: THREE.NoBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    hole.position.copy(this.position);
    hole.renderOrder = -100;
    this.scene.add(hole);
    this.movingSurfaces.push(hole);
  }

  screenGeometry() {
    return new THREE.PlaneGeometry(
      this.screenSize.width,
      this.screenSize.height,
    );
  }

  /**
   * Creates the texture layers for the computer screen
   * @returns the maximum offset of the texture layers
   */
  createTextureLayers() {
    const textures = this.resources.items.texture;

    this.getVideoTextures("video-1");
    this.getVideoTextures("video-2");

    // Scale factor to multiply depth offset by
    const scaleFactor = 0.1;

    // Construct the texture layers
    const layers = {
      smudge: {
        texture: textures.monitorSmudgeTexture,
        blending: THREE.AdditiveBlending,
        opacity: 0.025,
        offset: 24,
      },
      video: {
        texture: this.videoTextures["video-1"],
        blending: THREE.AdditiveBlending,
        opacity: 0.025,
        offset: 10,
      },
      video2: {
        texture: this.videoTextures["video-2"],
        blending: THREE.AdditiveBlending,
        opacity: 0.01,
        offset: 15,
      },
    };

    // Declare max offset
    let maxOffset = -1;

    // Add the texture layers to the screen
    for (const [_, layer] of Object.entries(layers)) {
      const offset = layer.offset * scaleFactor;
      this.addTextureLayer(
        layer.texture,
        layer.blending,
        layer.opacity,
        offset,
      );
      // Calculate the max offset
      if (offset > maxOffset) maxOffset = offset;
    }

    // Return the max offset
    return maxOffset;
  }

  getVideoTextures(videoId: string) {
    const video = document.getElementById(videoId);
    if (!video) {
      setTimeout(() => {
        this.getVideoTextures(videoId);
      }, 100);
    } else {
      this.videoTextures[videoId] = new THREE.VideoTexture(
        video as HTMLVideoElement,
      );
    }
  }

  /**
   * Adds a texture layer to the screen
   * @param texture the texture to add
   * @param blending the blending mode
   * @param opacity the opacity of the texture
   * @param offset the offset of the texture, higher values are further from the screen
   */
  addTextureLayer(
    texture: THREE.Texture,
    blendingMode: THREE.Blending,
    opacity: number,
    offset: number,
  ) {
    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      blending: blendingMode,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity,
      transparent: true,
    });

    // Create geometry
    const geometry = this.screenGeometry();

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Copy position and apply the depth offset
    mesh.position.copy(
      this.offsetPosition(this.position, new THREE.Vector3(0, 0, offset)),
    );

    // Copy rotation
    mesh.rotation.copy(this.rotation);

    this.scene.add(mesh);
    this.movingSurfaces.push(mesh);
  }

  /**
   * Creates enclosing planes for the computer screen
   * @param maxOffset the maximum offset of the texture layers
   */
  createEnclosingPlanes(maxOffset: number) {
    // Create planes, lots of boiler plate code here because I'm lazy
    const planes = {
      left: {
        size: new THREE.Vector2(maxOffset, this.screenSize.height),
        position: this.offsetPosition(
          this.position,
          new THREE.Vector3(-this.screenSize.width / 2, 0, maxOffset / 2),
        ),
        rotation: new THREE.Euler(0, 90 * THREE.MathUtils.DEG2RAD, 0),
      },
      right: {
        size: new THREE.Vector2(maxOffset, this.screenSize.height),
        position: this.offsetPosition(
          this.position,
          new THREE.Vector3(this.screenSize.width / 2, 0, maxOffset / 2),
        ),
        rotation: new THREE.Euler(0, 90 * THREE.MathUtils.DEG2RAD, 0),
      },
      top: {
        size: new THREE.Vector2(this.screenSize.width, maxOffset),
        position: this.offsetPosition(
          this.position,
          new THREE.Vector3(0, this.screenSize.height / 2, maxOffset / 2),
        ),
        rotation: new THREE.Euler(90 * THREE.MathUtils.DEG2RAD, 0, 0),
      },
      bottom: {
        size: new THREE.Vector2(this.screenSize.width, maxOffset),
        position: this.offsetPosition(
          this.position,
          new THREE.Vector3(0, -this.screenSize.height / 2, maxOffset / 2),
        ),
        rotation: new THREE.Euler(90 * THREE.MathUtils.DEG2RAD, 0, 0),
      },
    };

    // Add each of the planes
    for (const [_, plane] of Object.entries(planes)) {
      this.createEnclosingPlane(plane);
    }
  }

  /**
   * Creates a plane for the enclosing planes
   * @param plane the plane to create
   */
  createEnclosingPlane(plane: EnclosingPlane) {
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0x171819,
    });

    const geometry = new THREE.PlaneGeometry(plane.size.x, plane.size.y);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(plane.position);
    mesh.rotation.copy(plane.rotation);

    this.scene.add(mesh);
    this.movingSurfaces.push(mesh);
  }

  createPerspectiveDimmer(maxOffset: number) {
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0x000000,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const plane = this.screenGeometry();

    const mesh = new THREE.Mesh(plane, material);

    mesh.position.copy(
      this.offsetPosition(
        this.position,
        new THREE.Vector3(0, 0, maxOffset - 5),
      ),
    );

    mesh.rotation.copy(this.rotation);

    this.dimmingPlane = mesh;

    this.scene.add(mesh);
    this.movingSurfaces.push(mesh);
  }

  /**
   * Offsets a position vector by another vector
   * @param position the position to offset
   * @param offset the offset to apply
   * @returns the new offset position
   */
  offsetPosition(position: THREE.Vector3, offset: THREE.Vector3) {
    const newPosition = new THREE.Vector3();
    newPosition.copy(position);
    newPosition.add(offset);
    return newPosition;
  }

  update() {
    this.entryButton.hidden = this.camera.currentKeyframe === CameraKey.MONITOR;
    this.entryButton.disabled = !!this.camera.targetKeyframe ||
      (this.camera.currentKeyframe !== CameraKey.IDLE && this.camera.currentKeyframe !== CameraKey.DESK);
    const height = this.application.world.computerSetup.lift.height;
    const delta = height - this.appliedHeight;
    for (const surface of this.movingSurfaces) surface.position.y += delta;
    this.position.y = MONITOR.screenY + height;
    this.appliedHeight = height;
    if (this.dimmingPlane) {
      const planeNormal = new THREE.Vector3(0, 0, 1);
      const viewVector = new THREE.Vector3();
      viewVector.copy(this.camera.instance.position);
      viewVector.sub(this.position);
      viewVector.normalize();

      const dot = viewVector.dot(planeNormal);

      // calculate the distance from the camera vector to the plane vector
      const dimPos = this.dimmingPlane.position;
      const camPos = this.camera.instance.position;

      const distance = Math.sqrt(
        (camPos.x - dimPos.x) ** 2 +
          (camPos.y - dimPos.y) ** 2 +
          (camPos.z - dimPos.z) ** 2,
      );

      const opacity = 1 / (distance / 10000);

      const DIM_FACTOR = 0.7;

      // @ts-ignore
      this.dimmingPlane.material.opacity =
        (1 - opacity) * DIM_FACTOR + (1 - dot) * DIM_FACTOR;
    }
  }
}
