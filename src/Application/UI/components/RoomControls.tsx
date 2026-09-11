import React, { useEffect, useState } from "react";
import UIEventBus from "../EventBus";

export default function RoomControls({ hidden }: { hidden: boolean }) {
  const [muted, setMuted] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [navigation, setNavigation] = useState({ view: "idle", busy: true, entered: false, exploring: false });
  useEffect(() => {
    const mute = (e: Event) => setMuted((e as CustomEvent).detail);
    const camera = (e: Event) => setExploring((e as CustomEvent).detail);
    const nav = (e: Event) => setNavigation((e as CustomEvent).detail);
    document.addEventListener("cameraNavigationState", nav);
    UIEventBus.dispatch("cameraNavigationRequest", {});
    document.addEventListener("muteToggle", mute);
    document.addEventListener("freeCamToggle", camera);
    return () => {
      document.removeEventListener("muteToggle", mute);
      document.removeEventListener("freeCamToggle", camera);
      document.removeEventListener("cameraNavigationState", nav);
    };
  }, []);
  const navigate = (action: string) => UIEventBus.dispatch("cameraNavigation", action);
  return <>
    {!hidden && navigation.entered && <nav className="room-navigation" aria-label="Room navigation" data-desk-ui>
      {!navigation.exploring && navigation.view !== "monitor" && <button className="portfolio-control" disabled={navigation.busy} onClick={() => navigate("computer")}>Use computer</button>}
      {navigation.view === "monitor" && <button className="portfolio-control" disabled={navigation.busy} onClick={() => navigate("back")}>Step back</button>}
      {(navigation.view === "desk" || navigation.view === "monitor" || navigation.exploring) && <button className="portfolio-control" disabled={navigation.busy} onClick={() => navigate("room")}>Return to room</button>}
    </nav>}
    <nav style={hidden ? { display: "none" } : undefined} className="room-controls" aria-label="Room controls" data-desk-ui>
    <button className="portfolio-control" data-desk-ui aria-pressed={muted}
      onClick={() => UIEventBus.dispatch("muteToggle", !muted)}>
      {muted ? "Sound off" : "Sound on"}
    </button>
    <button className="portfolio-control" data-desk-ui aria-pressed={exploring} disabled={navigation.busy}
      onClick={() => UIEventBus.dispatch("freeCamToggle", !exploring)}>
      {exploring ? "Room overview" : "Look around"}
    </button>
    <button className="portfolio-control" data-desk-ui onClick={() => UIEventBus.dispatch("screenbarRequest", {})}>
      Lights
    </button>
  </nav></>;
}
