import UIEventBus from "../UI/EventBus";
import { assetLoadingManager } from "./assetLoading";

export default class Loading {
  progress = 0;
  ready = false;
  assetsReady = false;

  constructor() {
    let failed = false;
    let pending = 0;
    assetLoadingManager.onStart = (_url, loaded, total) => {
      pending = total - loaded;
    };
    assetLoadingManager.onError = () => {
      failed = true;
    };
    assetLoadingManager.onProgress = (sourceName, loaded, toLoad) => {
      pending = toLoad - loaded;
      if (this.ready) return;
      // Reserve completion for the fully assembled room, including canvas work.
      this.progress = Math.min(0.99, loaded / toLoad);
      UIEventBus.dispatch("loadedSource", {
        sourceName, progress: this.progress, loaded, toLoad,
      });
    };
    assetLoadingManager.onLoad = () => {
      // Let loader promise callbacks attach their meshes before enabling entry.
      requestAnimationFrame(() => {
        if (this.ready || failed || pending > 0) return;
        this.assetsReady = true;
      });
    };
  }

  /** Release the preloader only after WebGL and CSS3D have painted the entrance. */
  completeFirstFrame() {
    if (this.ready || !this.assetsReady) return;
    this.ready = true;
    this.progress = 1;
    UIEventBus.dispatch("loadedSource", { progress: 1 });
    UIEventBus.dispatch("roomReady", {});
  }
}
