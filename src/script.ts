import "./style.css";
import "./analytics";
import Application from "./Application/Application";

try {
  new Application();
} catch (error) {
  console.error("The 3D scene could not initialize.", error);
  const boot = document.getElementById("boot-screen");
  if (boot) boot.hidden = true;
  const ui = document.getElementById("ui");
  if (ui)
    ui.innerHTML = `<div style="color:white;font:16px monospace;text-align:center;padding:32px"><h1>Connor Love</h1><p style="margin:20px 0">Your desktop is ready.</p><a style="color:white" href="/desktop.html">Open the desktop <svg class="ui-arrow" style="width:1em;height:1em;vertical-align:-.13em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a></div>`;
}

// Match the portfolio's fill origin: enter from the nearest top/bottom edge.
document.addEventListener("pointerover", (event) => {
  const control = (event.target as Element).closest<HTMLElement>(
    ".portfolio-control",
  );
  if (
    !control ||
    (event.relatedTarget instanceof Node &&
      control.contains(event.relatedTarget))
  )
    return;
  const rect = control.getBoundingClientRect();
  control.style.setProperty("--fill-x", `${event.clientX - rect.left}px`);
  control.style.setProperty(
    "--fill-y",
    event.clientY < rect.top + rect.height / 2 ? "0%" : "100%",
  );
});
