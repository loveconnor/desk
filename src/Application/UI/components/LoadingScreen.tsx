import * as THREE from "three";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Application from "../../Application";
import eventBus from "../EventBus";

export default function LoadingScreen() {
  const resources = new Application().resources;
  const [progress, setProgress] = useState(
    resources.toLoad ? resources.loaded / resources.toLoad : 0,
  );
  const [entered, setEntered] = useState(false);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  const ready = progress >= 1;
  useLayoutEffect(() => {
    const boot = document.getElementById("boot-screen");
    if (!boot) return;
    const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
    boot.hidden = ready;
    boot.querySelector(".entry-progress")?.setAttribute("aria-valuenow", String(percent));
    const fill = boot.querySelector<HTMLElement>(".entry-progress > span");
    if (fill) fill.style.transform = `scaleX(${percent / 100})`;
    const label = document.getElementById("boot-percent");
    if (label) label.textContent = `${percent}%`;
  }, [progress, ready]);
  useEffect(() => {
    document.documentElement.dataset.roomLoading = "true";
    const onProgress = (event: Event) =>
      setProgress((event as CustomEvent).detail.progress);
    const onEntered = () => {
      setFinished(true);
      delete document.documentElement.dataset.roomLoading;
      const ui = document.getElementById("ui");
      if (ui) ui.style.pointerEvents = "none";
    };
    const onReturning = () => {
      setFinished(false);
      document.documentElement.dataset.roomLoading = "true";
      const ui = document.getElementById("ui");
      if (ui) ui.style.pointerEvents = "auto";
    };
    const onClosed = () => {
      started.current = false;
      setEntered(false);
    };
    document.addEventListener("returningToDoor", onReturning);
    document.addEventListener("doorClosed", onClosed);
    document.addEventListener("loadedSource", onProgress);
    document.addEventListener("loadingScreenDone", onEntered);
    return () => {
      document.removeEventListener("returningToDoor", onReturning);
      document.removeEventListener("doorClosed", onClosed);
      document.removeEventListener("loadedSource", onProgress);
      document.removeEventListener("loadingScreenDone", onEntered);
      delete document.documentElement.dataset.roomLoading;
    };
  }, []);
  const start = useCallback(() => {
    if (!ready || started.current) return;
    started.current = true;
    setEntered(true);
    eventBus.dispatch("openDoor", {});
  }, [ready]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !(event.target instanceof HTMLAnchorElement))
        start();
    };
    document.addEventListener("keydown", onKey);
    if (ready && new URLSearchParams(window.location.search).has("debug"))
      start();
    return () => document.removeEventListener("keydown", onKey);
  }, [ready, start]);
  const clickDoor = (event: React.MouseEvent<HTMLElement>) => {
    if (!ready || entered || (event.target as HTMLElement).closest("button, a"))
      return;
    const app = new Application();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        (-event.clientY / window.innerHeight) * 2 + 1,
      ),
      app.camera.instance,
    );
    if (ray.intersectObject(app.world.entrance.hinge, true).length) start();
  };
  return (
    <section
      className={`door-entry${ready ? " is-ready" : ""}${entered ? " is-opening" : ""}${finished ? " is-finished" : ""}`}
      data-desk-ui
      aria-label="Enter Connor's workspace"
      aria-hidden={finished}
      onClick={clickDoor}
    >
      <div className="door-entry-prompt">
        <button
          type="button"
          className="portfolio-control"
          aria-label="START"
          disabled={!ready || entered}
          onClick={start}
        >
          {ready
            ? "Open the door ↗"
            : `Preparing the room · ${Math.round(progress * 100)}%`}
        </button>
        <p>
          {ready
            ? "Click the door or press Enter"
            : "Your workspace is loading"}
        </p>
      </div>
      <a
        className="door-entry-skip"
        href="/desktop.html"
        tabIndex={entered ? -1 : 0}
      >
        Go straight to the desktop ↗
      </a>
    </section>
  );
}
