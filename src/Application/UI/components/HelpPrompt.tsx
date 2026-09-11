import { useEffect } from "react";
import * as THREE from "three";
import Application from "../../Application";

const HELP_TEXT = "Click the monitor, notes, or books";

/** A temporary floor projection in the clear space in front of the desk. */
export default function HelpPrompt() {
  useEffect(() => {
    const app = new Application();
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    const context = canvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = app.renderer.instance.capabilities.getMaxAnisotropy();
    const night = app.world.room.roomWindow.daylight < 0.2;
    const inkOpacity = night ? 0.6 : 0.8;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: inkOpacity,
      depthWrite: false,
      alphaTest: 0.02,
      // Let the wood show through, with only a little fill in the night scene.
      emissive: 0xffffff,
      emissiveMap: texture,
      emissiveIntensity: night ? 0.12 : 0,
    });
    const geometry = new THREE.PlaneGeometry(3800, 590);
    const note = new THREE.Mesh(geometry, material);
    note.name = "Desk instruction — floor projection";
    note.position.set(-2000, -2311, 3050);
    note.rotation.x = -Math.PI / 2;
    note.receiveShadow = true;
    // Transparent parts of the projection must not intercept scene clicks.
    note.raycast = () => {};
    app.scene.add(note);

    const draw = (count: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = '400 60px "Love Sans", sans-serif';
      context.textAlign = "left";
      context.textBaseline = "middle";
      const text = HELP_TEXT.slice(0, count);
      const left = (canvas.width - context.measureText(HELP_TEXT).width) / 2;
      context.fillStyle = night ? "#c9b28c" : "#493323";
      context.fillText(text, left, 80);
      texture.needsUpdate = true;
    };
    draw(0);
    let count = 0;
    let dismissed = false;
    let disposed = false;
    let fadeStart = 0;
    let timer: ReturnType<typeof setTimeout>;
    const type = () => {
      if (dismissed || disposed) return;
      draw(++count);
      if (count < HELP_TEXT.length)
        timer = setTimeout(type, Math.random() * 120 + 50);
    };
    const begin = () => {
      if (!disposed && !dismissed) timer = setTimeout(type, 500);
    };
    // Canvas does not redraw itself when a web font arrives.
    void document.fonts.load('400 60px "Love Sans"').then(begin, begin);

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      app.time.off("tick.deskprompt");
      note.removeFromParent();
      geometry.dispose();
      texture.dispose();
      material.dispose();
    };
    const hide = () => {
      if (dismissed || disposed) return;
      dismissed = true;
      clearTimeout(timer);
      fadeStart = performance.now();
      app.time.on("tick.deskprompt", () => {
        const progress = Math.min(1, (performance.now() - fadeStart) / 500);
        material.opacity = inkOpacity * (1 - progress);
        if (progress === 1) dispose();
      });
    };
    document.addEventListener("mousedown", hide);
    document.addEventListener("enterMonitor", hide);
    document.addEventListener("inspectRoomObject", hide);
    return () => {
      document.removeEventListener("mousedown", hide);
      document.removeEventListener("enterMonitor", hide);
      document.removeEventListener("inspectRoomObject", hide);
      dispose();
    };
  }, []);
  return null;
}
