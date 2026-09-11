import React, { useEffect, useState } from "react";
import Application from "../../Application";

export default function RoomHoverHint() {
  const [hint, setHint] = useState<{ label: string; x: number; y: number } | null>(null);
  useEffect(() => {
    const app = new Application();
    let frame = 0;
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      setHint(null);
      document.documentElement.style.cursor = "";
    };
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      if (event.pointerType === "touch") { clear(); return; }
      const target = event.target as HTMLElement;
      frame = requestAnimationFrame(() => {
        const camera = app.camera;
        if (camera.targetKeyframe || camera.inspectionActive || camera.paperActive ||
            !app.world.room.interactions.enabled || camera.currentKeyframe === "monitor") { clear(); return; }
        const control = target.closest<HTMLElement>("[data-room-hint]");
        const blocked = target.closest("[data-desk-ui], button, a, input, textarea");
        const label = control?.dataset.roomHint || (!blocked && app.world.room.interactions.hoverLabel(event.clientX, event.clientY));
        if (!label) { clear(); return; }
        document.documentElement.style.cursor = "pointer";
        setHint({ label, x: Math.max(8, Math.min(event.clientX + 16, innerWidth - 252)), y: Math.max(8, Math.min(event.clientY + 20, innerHeight - 56)) });
      });
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerdown", clear, true);
    document.addEventListener("cameraNavigationState", clear);
    document.documentElement.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", clear, true);
      document.removeEventListener("cameraNavigationState", clear);
      document.documentElement.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
    };
  }, []);
  return hint ? <div className="room-hover-hint" role="tooltip" style={{ left: hint.x, top: hint.y }}>{hint.label}<span aria-hidden="true">↗</span></div> : null;
}
