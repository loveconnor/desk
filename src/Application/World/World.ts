import Application from "../Application";
import Resources from "../Utils/Resources";
import PersonalDesk from "./PersonalDesk";
import MonitorScreen from "./MonitorScreen";
import Environment from "./Environment";
import Decor from "./Decor";
import Room from "./Room";
import WallControls from "./WallControls";
import Entrance from "./Entrance";
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
  room: Room;
  wallControls: WallControls;
  entrance: Entrance;
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
      this.room = new Room(this.computerSetup);
      this.entrance = new Entrance(this.computerSetup);
      this.monitorScreen = new MonitorScreen();

      this.coffeeSteam = new CoffeeSteam();
      this.audioManager = new AudioManager();
      this.wallControls = new WallControls(this.computerSetup);
      // const hb = new Hitboxes();
      // this.cursor = new Cursor();
    });
  }

  update() {
    if (this.room) this.room.update();
    if (this.wallControls) this.wallControls.update();
    if (this.computerSetup) this.computerSetup.update();
    if (this.monitorScreen) this.monitorScreen.update();
    if (this.environment) this.environment.update();
    if (this.coffeeSteam) this.coffeeSteam.update();
    if (this.audioManager) this.audioManager.update();
  }
}
