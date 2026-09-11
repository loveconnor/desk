import React, { useEffect, useState } from "react";
import UIEventBus from "../EventBus";

export default function RoomControls({ hidden }: { hidden: boolean }) {
  const [muted, setMuted] = useState(false);
  const [exploring, setExploring] = useState(false);
  useEffect(() => {
    const mute = (e: Event) => setMuted((e as CustomEvent).detail);
    const camera = (e: Event) => setExploring((e as CustomEvent).detail);
    document.addEventListener("muteToggle", mute);
    document.addEventListener("freeCamToggle", camera);
    return () => {
      document.removeEventListener("muteToggle", mute);
      document.removeEventListener("freeCamToggle", camera);
    };
  }, []);
  return <nav style={hidden ? { display: "none" } : undefined} className="room-controls" aria-label="Room controls" data-desk-ui>
    <button className="portfolio-control" data-desk-ui aria-pressed={muted}
      onClick={() => UIEventBus.dispatch("muteToggle", !muted)}>
      {muted ? "Sound off" : "Sound on"}
    </button>
    <button className="portfolio-control" data-desk-ui aria-pressed={exploring}
      onClick={() => UIEventBus.dispatch("freeCamToggle", !exploring)}>
      {exploring ? "Room overview" : "Look around"}
    </button>
    <button className="portfolio-control" data-desk-ui onClick={() => UIEventBus.dispatch("screenbarRequest", {})}>
      Lights
    </button>
  </nav>;
}
