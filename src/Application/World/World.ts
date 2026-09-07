import Application from "../Application";
import Resources from "../Utils/Resources";
import PersonalDesk from "./PersonalDesk";
import MonitorScreen from "./MonitorScreen";
import Environment from "./Environment";
import Decor from "./Decor";
import CoffeeSteam from "./CoffeeSteam";
import Cursor from "./Cursor";
import Hitboxes from "./Hitboxes";
import AudioManager from "../Audio/AudioManager";
export default class World {
  application: Application;
  scene: THREE.Scene;
  resources: Resources;

  // Objects in the scene
  environment: Environment;
  decor: Decor;
  computerSetup: PersonalDesk;
  monitorScreen: MonitorScreen;
  coffeeSteam: CoffeeSteam;
  cursor: Cursor;
  audioManager: AudioManager;

  constructor() {
    this.application = new Application();
    this.scene = this.application.scene;
    this.resources = this.application.resources;
    // Wait for resources
    this.resources.on("ready", () => {
      // Setup
      this.computerSetup = new PersonalDesk();
      this.monitorScreen = new MonitorScreen();

      this.coffeeSteam = new CoffeeSteam();
      this.audioManager = new AudioManager();
      // const hb = new Hitboxes();
      // this.cursor = new Cursor();
    });
  }

  update() {
    if (this.computerSetup) this.computerSetup.update();
    if (this.monitorScreen) this.monitorScreen.update();
    if (this.environment) this.environment.update();
    if (this.coffeeSteam) this.coffeeSteam.update();
    if (this.audioManager) this.audioManager.update();
  }
}
