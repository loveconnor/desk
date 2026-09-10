import UIEventBus from "../UI/EventBus";
import { assetLoadingManager } from "./assetLoading";

export default class Loading {
  progress = 0;
  ready = false;
  assetsReady = false;
  failed = false;
  private stallTimer: ReturnType<typeof setTimeout>;

  private watchProgress() {
    clearTimeout(this.stallTimer);
    this.stallTimer = setTimeout(() => this.fail(), 45000);
  }

  fail() {
    if (this.ready || this.failed) return;
    this.failed = true;
    clearTimeout(this.stallTimer);
    const status = document.getElementById("boot-status");
    if (status) {
      status.textContent = "Room unavailable — open the desktop below";
      status.setAttribute("role", "status");
    }
    const percent = document.getElementById("boot-percent");
    if (percent) percent.hidden = true;
    const progress = document.querySelector<HTMLElement>(".entry-progress");
    if (progress) progress.hidden = true;
  }

  constructor() {
    this.watchProgress();
    let pending = 0;
    assetLoadingManager.onStart = (_url, loaded, total) => {
      pending = total - loaded;
    };
    assetLoadingManager.onError = (url) => {
      console.warn(`Room asset unavailable: ${url}`);
    };
    assetLoadingManager.onProgress = (sourceName, loaded, toLoad) => {
      pending = toLoad - loaded;
      if (this.ready || this.failed) return;
      this.watchProgress();
      // Reserve completion for the fully assembled room, including canvas work.
      this.progress = Math.min(0.99, loaded / toLoad);
      UIEventBus.dispatch("loadedSource", {
        sourceName,
        progress: this.progress,
        loaded,
        toLoad,
      });
    };
    assetLoadingManager.onLoad = () => {
      // Let loader promise callbacks attach their meshes before enabling entry.
      requestAnimationFrame(() => {
        if (this.ready || this.failed || pending > 0) return;
        this.assetsReady = true;
      });
    };
  }

  /** Release the preloader only after WebGL and CSS3D have painted the entrance. */
  completeFirstFrame() {
    if (this.ready || this.failed || !this.assetsReady) return;
    clearTimeout(this.stallTimer);
    this.ready = true;
    this.progress = 1;
    UIEventBus.dispatch("loadedSource", { progress: 1 });
    UIEventBus.dispatch("roomReady", {});
  }
}
