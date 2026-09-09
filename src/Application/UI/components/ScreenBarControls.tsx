import React, { useEffect, useRef, useState } from "react";
import UIEventBus from "../EventBus";
import { SCREENBAR_TEMPERATURES, ScreenBarState } from "../../World/ScreenBar";

export default function ScreenBarControls() {
  const [state, setState] = useState<ScreenBarState | null>(null);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const show = (e: CustomEvent<ScreenBarState>) => {
      setState(e.detail);
      setOpen(true);
    };
    const update = (e: CustomEvent<ScreenBarState>) => setState(e.detail);
    const close = () => setOpen(false);
    document.addEventListener("screenbarOpen", show);
    document.addEventListener("screenbarState", update);
    document.addEventListener("returningToDoor", close);
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panel.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("screenbarOpen", show);
      document.removeEventListener("screenbarState", update);
      document.removeEventListener("returningToDoor", close);
      document.removeEventListener("keydown", escape, true);
    };
  }, []);
  if (!open || !state) return null;
  const command = (action: string, value?: number) =>
    UIEventBus.dispatch("screenbarCommand", { action, value });
  return (
    <section
      ref={panel}
      className="screenbar-panel"
      aria-label="BenQ ScreenBar controls"
      data-desk-ui
    >
      <div className="screenbar-heading">
        <h2>Desk light</h2>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close light controls"
        >
          ×
        </button>
      </div>
      <div className="screenbar-switches">
        <button
          aria-label={state.on ? "Light on" : "Light off"}
          aria-pressed={state.on}
          onClick={() => command("power")}
        >
          {state.on ? "On" : "Off"}
        </button>
        <button
          aria-label="Auto dimming"
          aria-pressed={state.auto}
          disabled={!state.on}
          onClick={() => command("auto")}
        >
          Auto
        </button>
      </div>
      <label>
        Brightness
        <input
          aria-label="ScreenBar brightness"
          type="range"
          min="1"
          max="15"
          step="1"
          value={state.brightness}
          disabled={!state.on}
          onChange={(e) => command("brightness", Number(e.target.value))}
        />
      </label>
      <label>
        Warmth
        <input
          className="screenbar-temperature"
          aria-label="ScreenBar color temperature"
          aria-valuetext={`${SCREENBAR_TEMPERATURES[state.temperature]} K`}
          type="range"
          min="0"
          max="7"
          step="1"
          value={state.temperature}
          disabled={!state.on}
          onChange={(e) => command("temperature", Number(e.target.value))}
        />
      </label>
      <div className="screenbar-scale">
        <span>Warm</span>
        <span>Cool</span>
      </div>
    </section>
  );
}
