import * as THREE from "three";

/** Position-based elastic sheet: Verlet inertia, stretch/shear and bending
 * constraints. Distances follow Müller et al., Position Based Dynamics (2007).
 * The animated transform is the hand; only a short grip along the top is pinned.
 */
export default class PaperPhysics {
  geometry = new THREE.PlaneGeometry(445, 576, 16, 22);
  rest: THREE.Vector3[] = [];
  points: THREE.Vector3[] = [];
  previous: THREE.Vector3[] = [];
  constraints: { a: number; b: number; length: number; stiffness: number }[] =
    [];
  inverseMass: number[] = [];
  lastVelocity = new THREE.Vector3();
  lastPosition = new THREE.Vector3();
  accumulator = 0;
  constructor() {
    const position = this.geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const p = new THREE.Vector3().fromBufferAttribute(position, i);
      this.rest.push(p);
      this.points.push(p.clone());
      this.previous.push(p.clone());
      this.inverseMass.push(i >= 6 && i <= 10 ? 0 : 1);
    }
    const link = (a: number, b: number, stiffness: number) =>
      this.constraints.push({
        a,
        b,
        length: this.rest[a].distanceTo(this.rest[b]),
        stiffness,
      });
    for (let y = 0; y <= 22; y++)
      for (let x = 0; x <= 16; x++) {
        const i = y * 17 + x;
        if (x < 16) link(i, i + 1, 1);
        if (y < 22) link(i, i + 17, 1);
        if (x < 16 && y < 22) {
          link(i, i + 18, 0.95);
          link(i + 1, i + 17, 0.95);
        }
        // Longer-range constraints resist curvature without making the sheet rigid.
        if (x < 14) link(i, i + 3, 0.65);
        if (y < 20) link(i, i + 51, 0.65);
      }
  }
  reset(position: THREE.Vector3) {
    this.points.forEach((p, i) => {
      p.copy(this.rest[i]);
      this.previous[i].copy(p);
    });
    this.lastPosition.copy(position);
    this.lastVelocity.set(0, 0, 0);
    this.accumulator = 0;
    this.upload();
  }
  step(
    dt: number,
    position: THREE.Vector3,
    rotation: THREE.Quaternion,
    flatten = 0,
    contact = false,
  ) {
    dt = Math.min(dt, 0.05);
    if (dt <= 0) return;
    const inverse = rotation.clone().invert();
    const velocity = position.clone().sub(this.lastPosition).divideScalar(dt);
    const acceleration = velocity
      .clone()
      .sub(this.lastVelocity)
      .divideScalar(dt)
      .negate()
      .applyQuaternion(inverse)
      .clampLength(0, 4500);
    acceleration.add(new THREE.Vector3(0, -1200, 0).applyQuaternion(inverse));
    this.lastPosition.copy(position);
    this.lastVelocity.copy(velocity);
    this.accumulator += dt;
    const h = 1 / 120;
    while (this.accumulator >= h) {
      this.accumulator -= h;
      this.points.forEach((p, i) => {
        if (!this.inverseMass[i]) {
          p.copy(this.rest[i]);
          this.previous[i].copy(p);
          return;
        }
        const old = p.clone();
        p.add(
          p.clone().sub(this.previous[i]).multiplyScalar(0.99),
        ).addScaledVector(acceleration, h * h);
        this.previous[i].copy(old);
      });
      for (let iteration = 0; iteration < 10; iteration++) {
        for (const c of this.constraints) {
          const a = this.points[c.a],
            b = this.points[c.b];
          const delta = b.clone().sub(a),
            length = delta.length();
          const mass = this.inverseMass[c.a] + this.inverseMass[c.b];
          if (!mass || length < 1e-8) continue;
          delta.multiplyScalar(
            (((length - c.length) / length) * c.stiffness) / mass,
          );
          a.addScaledVector(delta, this.inverseMass[c.a]);
          b.addScaledVector(delta, -this.inverseMass[c.b]);
        }
        this.points.forEach((p, i) => {
          // Elastic return-to-flat stiffness is deliberately weaker than stretch.
          if (this.inverseMass[i])
            p.lerp(this.rest[i], 0.0003 + flatten * 0.08);
          if (contact) {
            const world = p.clone().applyQuaternion(rotation).add(position);
            if (world.y < 3) {
              world.y = 3;
              p.copy(world.sub(position).applyQuaternion(inverse));
              this.previous[i].lerp(p, 0.4);
            }
          }
        });
      }
    }
    this.upload();
  }
  upload() {
    const attribute = this.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    this.points.forEach((p, i) => attribute.setXYZ(i, p.x, p.y, p.z));
    attribute.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
  }
}
