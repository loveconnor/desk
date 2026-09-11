import React, { useEffect, useRef, useState } from "react";
import UIEventBus from "../EventBus";
import { SCREENBAR_TEMPERATURES, ScreenBarState } from "../../World/ScreenBar";
import type { RoomLightState } from "../../World/LightControls";

export default function ScreenBarControls() {
  const [state, setState] = useState<ScreenBarState | null>(null);
  const [open, setOpen] = useState(false);
  const [lights, setLights] = useState<RoomLightState[]>([]);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const show = (e: CustomEvent<ScreenBarState>) => {
      setState(e.detail);
      setOpen(true);
      UIEventBus.dispatch("roomLightsRequest", {});
    };
    const update = (e: CustomEvent<ScreenBarState>) => setState(e.detail);
    const close = () => setOpen(false);
    const updateLights = (e: CustomEvent<RoomLightState[]>) => setLights(e.detail);
    document.addEventListener("roomLightsState", updateLights);
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
      document.removeEventListener("roomLightsState", updateLights);
      document.removeEventListener("screenbarState", update);
      document.removeEventListener("returningToDoor", close);
      document.removeEventListener("keydown", escape, true);
    };
  }, []);
  if (!open || !state) return null;
  const command = (action: string, value?: number) =>
    UIEventBus.dispatch("screenbarCommand", { action, value });
  const all = (on: boolean) => {
    if (state.on !== on) command("power");
    UIEventBus.dispatch("roomLightsCommand", { id: "all", on });
  };
  return (
    <section
      ref={panel}
      className="screenbar-panel"
      aria-label="Lights"
      data-desk-ui
    >
      <div className="screenbar-heading">
        <h2>Lights</h2>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close light controls"
        >
          ×
        </button>
      </div>
      <div className="screenbar-switches">
        <button onClick={() => all(true)}>All on</button>
        <button onClick={() => all(false)}>All off</button>
      </div>
      <details className="lights-desk" open>
        <summary>
          <span>Desk light</span>
          <svg className="lights-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
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
      </details>
      <h3 className="lights-section-title">Around the room</h3>
      <div className="lights-fixtures">
        {lights.filter(light => light.id !== "hallway").map(light => (
          <div className="lights-fixture" key={light.id}>
            <span>{light.name}</span>
            <button
              role="switch"
              aria-label={light.name}
              aria-checked={light.on}
              onClick={() => UIEventBus.dispatch("roomLightsCommand", { id: light.id, on: !light.on })}
            >
              {light.on ? "On" : "Off"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
