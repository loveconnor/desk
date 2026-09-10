import { assetLoadingManager } from "../Utils/assetLoading";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import PersonalDesk from "./PersonalDesk";

/** Independent exterior lighting: blinds darken the room, never the city. */
export default class CityExterior {
  group = new THREE.Group();
  ready = false;
  private lastDay = NaN;
  private materials = new Map<THREE.MeshBasicMaterial, THREE.Color>();
  sun = new THREE.DirectionalLight(0xffefd9, 1.6);
  ambient = new THREE.HemisphereLight(0xbfdcff, 0x6c6261, 1);
  sky = new THREE.MeshBasicMaterial({
    color: 0x85b6d7,
    side: THREE.BackSide,
    fog: false,
  });
  streetLampGlow = new THREE.MeshBasicMaterial({ color: 0xffce88 });
  constructor(private desk: PersonalDesk) {
    this.group.name = "Modeled city blocks — Kenney commercial buildings";
    desk.app.scene.add(this.group);
    desk.app.camera.instance.layers.enable(1);
    this.sun.position.set(-12000, 18000, -4000);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(150000, 32, 16),
      this.sky,
    );
    this.group.add(dome);
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      color: number,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
      );
      mesh.position.set(x, y, z);
      this.group.add(mesh);
      return mesh;
    };
    // Continuous ground extends all the way to the building exterior wall.
    box(180000, 180, 150000, -2600, -5590, -77100, 0x383d42);
    for (let row = 0; row < 7; row++) {
      const z = -7200 - row * 7200;
      for (let col = 0; col < 9; col++) {
        const x = -22000 + col * 5000;
        box(3900, 100, 4900, x, -5450, z, 0x696b68);
      }
      for (let x = -24000; x < 22000; x += 1600)
        box(650, 8, 35, x, -5490, z + 3400, 0xc1b589);
    }
    // Near curb, crosswalk, and street lamps make the view read as a street.
    for (let x = -21000; x < 21000; x += 4800) {
      box(45, 1700, 45, x, -4650, -4400, 0x343e43);
      box(340, 50, 140, x + 120, -3800, -4400, 0x343e43);
      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(220, 12, 100),
        this.streetLampGlow,
      );
      glow.position.set(x + 120, -3830, -4400);
      this.group.add(glow);
    }
    const names = [
      "building-a",
      "building-f",
      "building-j",
      "building-m",
      "building-skyscraper-a",
      "building-skyscraper-c",
      "building-skyscraper-e",
    ];
    Promise.all(
      names.map((name) => new GLTFLoader(assetLoadingManager).loadAsync(`/room/city/${name}.glb`)),
    ).then((models) => {
      for (let row = 0; row < 7; row++)
        for (let col = 0; col < 9; col++) {
          const index =
            row > 0 || col % 2 === 0 ? 4 + ((col + row) % 3) : (col + row) % 4;
          const model = models[index].scene.clone(true);
          model.userData.facadeTint = [
            0xb86f50, 0xc1b394, 0x937969, 0x8ca6b2, 0x78948e, 0xd1bb90,
            0x956552,
          ][(col + row * 2) % 7];
          const bounds = new THREE.Box3().setFromObject(model),
            size = bounds.getSize(new THREE.Vector3());
          const scale = 3000 / Math.max(size.x, size.z);
          model.scale.multiplyScalar(scale);
          const height =
            index >= 4
              ? 13000 + ((col * 7 + row * 3) % 5) * 2400
              : 7000 + (col % 3) * 1200;
          model.scale.y *= height / (size.y * scale);
          model.updateMatrixWorld(true);
          const scaled = new THREE.Box3().setFromObject(model),
            center = scaled.getCenter(new THREE.Vector3());
          const x = -22000 + col * 5000,
            z = -7200 - row * 7200;
          model.position.set(x - center.x, -5400 - scaled.min.y, z - center.z);
          model.name = `City block ${row}-${col}: ${names[index]}`;
          this.group.add(model);
        }
      this.setLayers();
      this.ready = true;
    });
    this.setLayers();
  }
  private setLayers() {
    this.lastDay = NaN;
    this.group.traverse((object) => {
      object.layers.set(1);
      if (!(object instanceof THREE.Mesh)) return;
      const convert = (original: THREE.Material) => {
        if (!(original instanceof THREE.MeshStandardMaterial)) return original;
        const material = new THREE.MeshBasicMaterial({
          color: original.color,
          map: original.map,
          side: original.side,
        });
        let owner: THREE.Object3D | null = object;
        while (owner && owner.userData.facadeTint === undefined)
          owner = owner.parent;
        const tint = new THREE.Color(
          owner?.userData.facadeTint ?? 0xffffff,
        ).convertSRGBToLinear();
        material.onBeforeCompile = (shader) => {
          shader.uniforms.facadeTint = { value: tint };
          shader.vertexShader =
            "varying float facadeShade;\n" + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nfacadeShade = 0.58 + 0.42 * max(0.0, dot(normalize(mat3(modelMatrix)*normal),normalize(vec3(-0.6,0.8,0.5))));",
          );
          shader.fragmentShader =
            "varying float facadeShade; uniform vec3 facadeTint;\n" +
            shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            "#include <color_fragment>\nfloat masonry = smoothstep(0.45, 0.85, min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b)));\ndiffuseColor.rgb *= mix(vec3(1.0), facadeTint, masonry) * facadeShade;",
          );
        };
        this.materials.set(material, material.color.clone());
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(convert)
        : convert(object.material);
    });
  }
  update(day: number) {
    if (day === this.lastDay) return;
    this.lastDay = day;
    this.materials.forEach((color, material) =>
      material.color.copy(color).multiplyScalar(0.035 + day * 0.965),
    );
    this.sun.intensity = day * 1.6;
    this.ambient.intensity = 0.06 + day * 0.94;
    this.sky.color.setRGB(
      0.012 + day * 0.38,
      0.022 + day * 0.53,
      0.055 + day * 0.66,
    );
    this.streetLampGlow.color.setRGB(
      0.18 + (1 - day) * 0.8,
      0.22 + (1 - day) * 0.42,
      0.25 + (1 - day) * 0.05,
    );
  }
}
