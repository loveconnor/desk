import { assetLoadingManager } from "../Utils/assetLoading";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Free Flareworks Studio Z207 asset, converted to meters; attribution beside GLB. */
export default class LogitechSpeakers extends THREE.Group {
  readonly ready: Promise<void>;
  constructor(renderer: THREE.WebGLRenderer) {
    super();
    this.name = "Logitech Z207 stereo speakers";
    this.ready = new GLTFLoader(assetLoadingManager)
      // Refresh cached intermediate exports that clamped the logo's white edges.
      .loadAsync("/models/logitech-z207/speakers.glb?v=d9b393c3")
      .then(({ scene }) => {
        for (const [name, x] of [
          ["LeftSpeaker", -1120],
          ["RightSpeaker", 1120],
        ] as const) {
          const speaker = scene.getObjectByName(name);
          if (!speaker) throw new Error(`Logitech Z207 asset missing ${name}`);
          // Meter-authored speakers use the same 22.5 units/cm as the mouse/mat.
          speaker.scale.setScalar(2250);
          speaker.position.set(x, 352.5, -345);
          speaker.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            object.castShadow = true;
            // Avoid self-shadow acne on the tightly recessed driver surfaces.
            object.receiveShadow = false;
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            for (const material of materials) {
              const map = (material as THREE.MeshStandardMaterial).map;
              if (map)
                map.anisotropy = renderer.capabilities.getMaxAnisotropy();
            }
          });
          this.add(speaker);
        }
        renderer.shadowMap.needsUpdate = true;
      });
    // The source's loose cables were removed for independent satellite placement.
    const cable = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x202326).convertSRGBToLinear(),
      roughness: 0.85,
    });
    for (const x of [-1120, 1120]) {
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 390, -470),
        new THREE.Vector3(x + 45, 357, -530),
        new THREE.Vector3(x + 85, 356, -655),
        new THREE.Vector3(x + 85, 285, -695),
      ]);
      const wire = new THREE.Mesh(
        new THREE.TubeGeometry(path, 20, 3.2, 6, false),
        cable,
      );
      wire.name = "Speaker cable routed behind shelf";
      wire.castShadow = true;
      this.add(wire);
    }
  }
}
