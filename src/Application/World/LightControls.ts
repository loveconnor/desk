import UIEventBus from "../UI/EventBus";

export interface RoomLightState {
  id: string;
  name: string;
  on: boolean;
}

/** Shared state for the panel and the switches on the actual fixtures. */
export default class LightControls {
  private fixtures = new Map<string, RoomLightState & { apply: (on: boolean) => void }>();
  revision = 0;

  constructor() {
    document.addEventListener("roomLightsRequest", () => this.publish());
    document.addEventListener("roomLightsCommand", (event: CustomEvent) => {
      const { id, on } = event.detail ?? {};
      if (typeof on !== "boolean") return;
      if (id === "all") this.fixtures.forEach(light => this.set(light.id, on));
      else this.set(id, on);
    });
  }

  register(id: string, name: string, apply: (on: boolean) => void) {
    this.fixtures.set(id, { id, name, on: true, apply });
    this.publish();
    return () => this.set(id, !this.fixtures.get(id)!.on);
  }

  set(id: string, on: boolean) {
    const light = this.fixtures.get(id);
    if (!light || light.on === on) return;
    light.on = on;
    light.apply(on);
    this.revision++;
    this.publish();
  }

  get indoorFill() {
    const indoor = [...this.fixtures.values()].filter(light => light.id !== "hallway");
    return indoor.length ? indoor.filter(light => light.on).length / indoor.length : 0;
  }

  private publish() {
    UIEventBus.dispatch("roomLightsState", [...this.fixtures.values()].map(({ id, name, on }) => ({ id, name, on })));
  }
}
