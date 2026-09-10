import * as THREE from "three";

/** Every shadow map consumes a sampler in every shadow-receiving material.
 * Apply once after assets load, before shaders compile or shadow maps allocate.
 */
export function applyShadowBudget(scene: THREE.Scene, maxTextures: number, compact: boolean) {
  const lights: THREE.Light[] = [];
  let materialSamplers = 0;
  scene.traverse((object) => {
    if (object instanceof THREE.Light && object.castShadow) lights.push(object);
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      // Count map slots individually, even when they share a texture image.
      let count = Object.values(material).filter(value => value instanceof THREE.Texture).length;
      if (material instanceof THREE.MeshStandardMaterial && !material.envMap && scene.environment) count++;
      if (material instanceof THREE.MeshPhysicalMaterial && material.transmission > 0) count++;
      materialSamplers = Math.max(materialSamplers, count);
    }
  });
  // Reserve at least eight material samplers; phones also benefit from fewer
  // shadow render targets. All fixtures continue to illuminate the room.
  const budget = Math.max(0, Math.min(compact ? 4 : 8, maxTextures - Math.max(8, materialSamplers)));
  const priority = (light: THREE.Light) =>
    light instanceof THREE.DirectionalLight ? 100 :
      light.name === "Hallway sconce contact light" ? 90 : 0;
  lights.sort((a, b) => priority(b) - priority(a));
  lights.slice(budget).forEach(light => { light.castShadow = false; });
}
