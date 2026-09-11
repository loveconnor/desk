import * as THREE from "three";
import PersonalDesk from "./PersonalDesk";
import Room from "./Room";

/** Light belongs to a visible fitting, with limited reach and an operable switch. */
export default class ApartmentLighting {
  private ceilingFixtures: Array<{ mesh: THREE.Object3D; apply: (on: boolean) => void }> = [];
  constructor(
    private desk: PersonalDesk,
    private room: Room,
  ) {
    this.ceiling("Office ceiling light", -1200, 1400, 5250, 500, 1.15);
    this.ceiling("Back-left ceiling light", -10300, 1400, 5250, 640, 1.15);
    this.ceiling("Kitchen ceiling light", -10300, 6300, 5250, 640, 1.7);
    this.ceiling("Living room pendant", -1200, 10600, 3500, 740, 1.45);
    this.ceiling("Dining pendant", -10200, 12600, 2800, 440, 1.15);
    const toggleCeiling = this.room.lights.register("ceiling", "Ceiling lights", (on) => {
      this.ceilingFixtures.forEach(fixture => fixture.apply(on));
    });
    this.ceilingFixtures.forEach(({ mesh }) => {
      this.room.interactions.add(mesh, "Toggle ceiling lights", toggleCeiling);
    });
    this.printer();
  }
  private fitting(name: string) {
    const g = new THREE.Group();
    g.name = name;
    this.room.group.add(g);
    return g;
  }
  private spot(
    g: THREE.Group,
    position: THREE.Vector3,
    target: THREE.Vector3,
    power: number,
    distance: number,
  ) {
    const light = new THREE.SpotLight(
      0xffdfb5,
      power,
      distance,
      Math.PI / 2.6,
      0.8,
      1.5,
    );
    light.name = `${g.name} illumination`;
    light.position.copy(position);
    light.target.position.copy(target);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.camera.near = 50;
    light.shadow.bias = -0.00015;
    light.shadow.normalBias = 4;
    g.add(light, light.target);
    return light;
  }
  private ceiling(
    name: string,
    x: number,
    z: number,
    y: number,
    r: number,
    power: number,
  ) {
    const g = this.fitting(name);
    g.position.set(x, 0, z);
    const metal = this.desk.material(0x494840, 0.5);
    const opal = this.desk.material(0xf1e7d7);
    opal.emissive.setHex(0xffd6a0);
    opal.emissiveIntensity = 0.7;
    this.desk.cylinder(150, 60, 0, 5460, 0, metal, 150, g);
    if (y < 5000)
      this.desk.cylinder(12, 5460 - y, 0, (5460 + y) / 2, 0, metal, 12, g);
    this.desk.cylinder(r, 120, 0, y, 0, metal, r, g);
    const diffuser = this.desk.cylinder(
      r - 35,
      45,
      0,
      y - 65,
      0,
      opal,
      r - 35,
      g,
    );
    diffuser.castShadow = false;
    const light = this.spot(
      g,
      new THREE.Vector3(0, y - 100, 0),
      new THREE.Vector3(0, -2300, 0),
      power,
      11000,
    );
    // A small diffuse component represents the frosted shade's sideways spill.
    const spill = new THREE.PointLight(0xffdfb5, power * 0.2, 7500, 2);
    spill.position.set(0, y - 110, 0);
    g.add(spill);
    this.switch(diffuser, name, [light, spill], [opal], true);
  }
  private printer() {
    const g = this.fitting("Printer task sconce");
    g.position.set(-8500, 600, -1950);
    const metal = this.desk.material(0x424943, 0.45);
    this.desk.box(160, 340, 65, 0, 1350, 0, metal, 15, g);
    this.desk.line(
      [
        [0, 1350, 40],
        [0, 1350, 320],
        [0, 1150, 470],
      ],
      22,
      metal,
      g,
    );
    const shade = this.desk.cylinder(230, 170, 0, 1100, 470, metal, 140, g);
    const lens = this.desk.material(0xf4e6cc);
    lens.emissive.setHex(0xffdfb5);
    lens.emissiveIntensity = 0.8;
    this.desk.cylinder(200, 12, 0, 1009, 470, lens, 200, g).castShadow = false;
    const light = this.spot(
      g,
      new THREE.Vector3(0, 985, 470),
      new THREE.Vector3(300, -1300, 570),
      1.4,
      4200,
    );
    light.angle = 0.9;
    this.switch(shade, "Printer task light", [light], [lens]);
  }
  private switch(
    mesh: THREE.Object3D,
    name: string,
    lights: THREE.Light[],
    materials: THREE.MeshStandardMaterial[],
    ceiling = false,
  ) {
    const levels = lights.map((l) => l.intensity),
      emission = materials.map((m) => m.emissiveIntensity);
    const apply = (on: boolean) => {
      lights.forEach((l, i) => (l.intensity = on ? levels[i] : 0));
      materials.forEach((m, i) => (m.emissiveIntensity = on ? emission[i] : 0));
      this.desk.app.renderer.instance.shadowMap.needsUpdate = true;
    };
    if (ceiling) {
      this.ceilingFixtures.push({ mesh, apply });
      return;
    }
    const toggle = this.room.lights.register(name, name, apply);
    this.room.interactions.add(mesh, `Toggle ${name.toLowerCase()}`, toggle);
  }
}
