import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/** Project the jacket onto the entire solid, including its rounded edge vertices. */
export function jacketGeometry(
  width: number,
  height: number,
  depth: number,
  surface: "front" | "back" | "spine",
) {
  const geometry = new RoundedBoxGeometry(
    width,
    height,
    depth,
    3,
    Math.min(1.2, depth / 4, width / 4),
  );
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < position.count; i++) {
    const u =
      surface === "spine"
        ? position.getZ(i) / depth + 0.5
        : surface === "back"
          ? 0.5 - position.getX(i) / width
          : position.getX(i) / width + 0.5;
    uv.setXY(
      i,
      THREE.MathUtils.clamp(u, 0, 1),
      THREE.MathUtils.clamp(position.getY(i) / height + 0.5, 0, 1),
    );
  }
  return geometry;
}
