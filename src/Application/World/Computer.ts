import * as THREE from "three";
import Application from "../Application";
import BakedModel from "../Utils/BakedModel";
import Resources from "../Utils/Resources";

export default class Computer {
  application: Application;
  scene: THREE.Scene;
  resources: Resources;
  bakedModel: BakedModel;

  constructor() {
    this.application = new Application();
    this.scene = this.application.scene;
    this.resources = this.application.resources;

    this.bakeModel();
    this.setModel();
    this.addNameSticker();
  }

  bakeModel() {
    this.bakedModel = new BakedModel(
      this.resources.items.gltfModel.computerSetupModel,
      this.resources.items.texture.computerSetupTexture,
      900,
    );
  }

  addNameSticker() {
    // These corners follow the monitor bezel's surface, including its slight
    // curvature. A separate mesh covers the baked-in label without changing
    // the original texture atlas or the rest of the computer.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          -735.0334, 415.9766, 478.3716, -388.7074, 416.6586, 500.5727,
          -735.0337, 332.5679, 485.7432, -388.7075, 333.2273, 507.2162,
        ],
        3,
      ),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2),
    );
    geometry.setIndex([0, 2, 1, 2, 3, 1]);
    const texture = new THREE.TextureLoader().load(
      "/branding/connor-love-sticker.svg",
    );
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy =
      this.application.renderer.instance.capabilities.getMaxAnisotropy();
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const sticker = new THREE.Mesh(geometry, material);
    sticker.name = "Connor Love monitor sticker";
    this.scene.add(sticker);
  }

  setModel() {
    this.scene.add(this.bakedModel.getModel());
  }
}
