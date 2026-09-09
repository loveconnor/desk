import * as THREE from "three";
import { MONITOR, monitorSag } from "./monitorLayout";

/** One live iframe, continuously displaced to the projected cylindrical surface. */
export default class CurvedDesktop {
  private image: SVGFEImageElement;
  private displacement: SVGFEDisplacementMapElement;
  private canvas = document.createElement("canvas");
  private context: CanvasRenderingContext2D;
  private camera = new THREE.Vector3();
  private previous = new THREE.Vector3(Infinity, Infinity, Infinity);
  private scale = 256;
  private pressed?: Element;
  constructor(
    private source: HTMLIFrameElement,
    private position: THREE.Vector3,
    private width: number,
    private height: number,
  ) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    const filter = document.createElementNS(ns, "filter");
    const id = "continuous-monitor-curve";
    filter.id = id;
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("primitiveUnits", "userSpaceOnUse");
    filter.setAttribute("x", "-256");
    filter.setAttribute("y", "-256");
    filter.setAttribute("width", String(width + 512));
    filter.setAttribute("height", String(height + 512));
    filter.setAttribute("color-interpolation-filters", "sRGB");
    this.image = document.createElementNS(ns, "feImage");
    this.image.setAttribute("x", "-256");
    this.image.setAttribute("y", "-256");
    this.image.setAttribute("width", String(width + 512));
    this.image.setAttribute("height", String(height + 512));
    this.image.setAttribute("preserveAspectRatio", "none");
    this.image.setAttribute("result", "curve");
    this.displacement = document.createElementNS(ns, "feDisplacementMap");
    this.displacement.setAttribute("in", "SourceGraphic");
    this.displacement.setAttribute("in2", "curve");
    this.displacement.setAttribute("xChannelSelector", "R");
    this.displacement.setAttribute("yChannelSelector", "G");
    filter.append(this.image, this.displacement);
    svg.append(filter);
    document.body.append(svg);
    source.style.filter = `url(#${id})`;
    source.classList.remove("jitter");
    this.canvas.width = 128;
    this.canvas.height = 64;
    this.context = this.canvas.getContext("2d")!;
    const doc = source.contentDocument!,
      win = source.contentWindow!;
    for (const type of [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "mousedown",
      "mousemove",
      "mouseup",
      "click",
      "dblclick",
      "contextmenu",
      "wheel",
    ])
      doc.addEventListener(
        type,
        (event) => {
          if (!event.isTrusted) return;
          const e = event as MouseEvent;
          const p = this.sourcePoint(e.clientX, e.clientY);
          const hit = doc.elementFromPoint(p.x, p.y);
          if (!hit) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          const target =
            this.pressed && /pointermove|pointerup|pointercancel/.test(type)
              ? this.pressed
              : hit;
          if (type === "pointerdown") this.pressed = hit;
          if (type === "mousedown")
            hit
              .closest<HTMLElement>("input,textarea,select,[contenteditable]")
              ?.focus({ preventScroll: true });
          const init = {
            clientX: p.x,
            clientY: p.y,
            bubbles: true,
            cancelable: true,
            button: e.button,
            buttons: e.buttons,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
          };
          const forwarded = type.startsWith("pointer")
            ? new (win as any).PointerEvent(type, {
                ...init,
                pointerId: (e as PointerEvent).pointerId,
                pointerType: (e as PointerEvent).pointerType,
              })
            : new (win as any).MouseEvent(type, init);
          target.dispatchEvent(forwarded);
          if (type === "pointerup" || type === "pointercancel")
            this.pressed = undefined;
          if (type === "wheel") {
            let scroll: Element | null = hit;
            while (scroll && scroll.scrollHeight <= scroll.clientHeight)
              scroll = scroll.parentElement;
            if (scroll) scroll.scrollTop += (event as WheelEvent).deltaY;
          }
        },
        { capture: true, passive: false },
      );
  }
  /** Intersect the camera ray through a flat-plane pixel with the cylinder. */
  sourcePoint(u: number, v: number) {
    const { x: cx, y: cy, z: cz } = this.camera;
    const dx = u - this.width / 2 - cx,
      dz = -cz;
    const a = dx * dx + dz * dz,
      b = 2 * (cx * dx + (cz - MONITOR.radius) * dz),
      c = cx * cx + (cz - MONITOR.radius) ** 2 - MONITOR.radius ** 2;
    const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
    return {
      x: cx + dx * t + this.width / 2,
      y: this.height / 2 - (cy + (this.height / 2 - v - cy) * t),
    };
  }
  update(camera: THREE.Camera) {
    this.camera.copy(camera.position).sub(this.position);
    if (this.camera.distanceToSquared(this.previous) < 0.25) return;
    this.previous.copy(this.camera);
    const w = this.canvas.width,
      h = this.canvas.height;
    const data = this.context.createImageData(w, h);
    let max = 32;
    const offsets: number[] = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const u = -256 + ((x + 0.5) / w) * (this.width + 512),
          v = -256 + ((y + 0.5) / h) * (this.height + 512);
        const p = this.sourcePoint(u, v);
        offsets.push(p.x - u, p.y - v);
        max = Math.max(max, Math.abs(p.x - u) * 2, Math.abs(p.y - v) * 2);
      }
    this.scale = Math.min(2048, max + 4);
    for (let i = 0; i < w * h; i++) {
      data.data[i * 4] = Math.round(255 * (0.5 + offsets[i * 2] / this.scale));
      data.data[i * 4 + 1] = Math.round(
        255 * (0.5 + offsets[i * 2 + 1] / this.scale),
      );
      data.data[i * 4 + 2] = 128;
      data.data[i * 4 + 3] = 255;
    }
    this.context.putImageData(data, 0, 0);
    this.displacement.setAttribute("scale", String(this.scale));
    this.image.setAttribute("href", this.canvas.toDataURL());
  }
}
