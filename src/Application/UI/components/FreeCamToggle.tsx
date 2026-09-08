import React, { useState } from "react";
import UIEventBus from "../EventBus";
// @ts-ignore
import camera from "/textures/UI/camera.svg";
// @ts-ignore
import mouse from "/textures/UI/mouse.svg";

export default function FreeCamToggle() {
  const [active, setActive] = useState(false);
  const toggle = () => {
    const next = !active;
    setActive(next);
    window.postMessage({ type: "keydown", key: "_AUTO_" }, "*");
    UIEventBus.dispatch("freeCamToggle", next);
  };
  return (
    <button
      type="button"
      className="portfolio-control portfolio-icon"
      data-desk-ui
      aria-label={active ? "Exit free camera" : "Explore room"}
      aria-pressed={active}
      title={active ? "Exit free camera" : "Explore room"}
      onClick={toggle}
    >
      <img src={active ? mouse : camera} alt="" />
    </button>
  );
}
