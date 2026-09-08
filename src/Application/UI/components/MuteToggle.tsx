import React, { useEffect, useState } from "react";
import UIEventBus from "../EventBus";
// @ts-ignore
import volumeOn from "/textures/UI/volume_on.svg";
// @ts-ignore
import volumeOff from "/textures/UI/volume_off.svg";

export default function MuteToggle() {
  const [muted, setMuted] = useState(false);
  useEffect(() => UIEventBus.dispatch("muteToggle", muted), [muted]);
  return (
    <button
      type="button"
      className="portfolio-control portfolio-icon"
      data-desk-ui
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      aria-pressed={muted}
      title={muted ? "Unmute audio" : "Mute audio"}
      onClick={() => setMuted((value) => !value)}
    >
      <img src={muted ? volumeOff : volumeOn} alt="" />
    </button>
  );
}
