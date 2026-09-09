import EventEmitter from "./EventEmitter";

export default class Time extends EventEmitter {
  start = Date.now();
  current = this.start;
  elapsed = 0;
  delta = 16;
  private frame: number | undefined;
  private destroyed = false;

  constructor() {
    super();
    document.addEventListener("visibilitychange", this.visibilityChanged);
    document.addEventListener("loadingScreenDone", this.resetStart);
    this.schedule();
  }

  private resetStart = () => {
    this.start = Date.now();
  };

  private visibilityChanged = () => {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    // Preserve wall-clock animation phase without a large simulation delta.
    this.current = Date.now();
    this.delta = 0;
    this.schedule();
  };

  private schedule() {
    if (!this.destroyed && !document.hidden && this.frame === undefined)
      this.frame = requestAnimationFrame(this.tick);
  }

  tick = () => {
    this.frame = undefined;
    if (this.destroyed || document.hidden) return;
    const currentTime = Date.now();
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = this.current - this.start;
    this.trigger("tick");
    this.schedule();
  };

  destroy() {
    this.destroyed = true;
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    document.removeEventListener("visibilitychange", this.visibilityChanged);
    document.removeEventListener("loadingScreenDone", this.resetStart);
    this.off("tick");
  }
}
