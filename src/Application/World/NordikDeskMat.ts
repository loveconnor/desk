import * as THREE from "three";

/** Nordik Premium Felt Desk Mat, Charcoal (35 × 17 in).
 * Reference: https://www.nordikbydesign.com/products/premium-felt-desk-mat
 * Scene scale is 22.5 units/cm. Thickness and corner radius are photo estimates.
 */
export default class NordikDeskMat extends THREE.Group {
  static readonly surfaceY = 9;

  constructor(anisotropy: number) {
    super();
    this.name = "Nordik felt desk mat — Charcoal, 35 × 17 in";
    const width = 88.9 * 22.5;
    const depth = 43.18 * 22.5;
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    let seed = 73619;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ctx.fillStyle = "#444548";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Irregular mixed-grey wool clusters, without a woven grid or repeating tile.
    for (const [size, alpha] of [
      [48, 0.14],
      [12, 0.2],
      [3, 0.22],
    ]) {
      const noise = document.createElement("canvas");
      noise.width = Math.ceil(canvas.width / size);
      noise.height = Math.ceil(canvas.height / size);
      const nctx = noise.getContext("2d")!;
      const pixels = nctx.createImageData(noise.width, noise.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const value = Math.floor(random() * 255);
        pixels.data.set([value, value, value, 255], i);
      }
      nctx.putImageData(pixels, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(noise, 0, 0, canvas.width, canvas.height);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 160000; i++) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const angle = random() * Math.PI * 2;
      const length = 1 + random() * 6;
      ctx.strokeStyle =
        random() < 0.48 ? "rgba(181,183,186,0.28)" : "rgba(21,22,24,0.3)";
      ctx.lineWidth = 0.35 + random() * 0.65;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.encoding = THREE.sRGBEncoding;
    map.anisotropy = anisotropy;
    const bump = new THREE.CanvasTexture(canvas);
    bump.anisotropy = anisotropy;
    const felt = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x999b9f).convertSRGBToLinear(),
      map,
      bumpMap: bump,
      bumpScale: 0.18,
      roughness: 1,
      metalness: 0,
    });
    const edge = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x38393c).convertSRGBToLinear(),
      roughness: 1,
    });
    // Extrude a rounded outline: corner radius must not be limited by thickness.
    const slab = (w: number, d: number, h: number, radius: number) => {
      const shape = new THREE.Shape();
      const x = -w / 2,
        y = -d / 2,
        r = radius;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + d - r);
      shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
      shape.lineTo(x + r, y + d);
      shape.quadraticCurveTo(x, y + d, x, y + d - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: h,
        bevelEnabled: false,
        curveSegments: 12,
      });
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, positions.getX(i) / w + 0.5, 0.5 - positions.getZ(i) / d);
      return geometry;
    };
    const body = new THREE.Mesh(slab(width, depth, 8.2, 27), [felt, edge]);
    body.name = "Seamless charcoal felt with cut rounded edges";
    body.position.y = 0.8;
    body.castShadow = body.receiveShadow = true;
    this.add(body);
    const backing = new THREE.Mesh(slab(width - 2, depth - 2, 0.8, 26), edge);
    backing.name = "Thin dark non-slip underside";
    this.add(backing);

    // The mat can be rotated either way; keep the leather tab on the right.
    const label = document.createElement("canvas");
    label.width = 256;
    label.height = 192;
    const lctx = label.getContext("2d")!;
    lctx.fillStyle = "#ad734a";
    lctx.fillRect(0, 0, 256, 192);
    for (let i = 0; i < 9000; i++) {
      lctx.fillStyle = random() < 0.5 ? "#ffffff0b" : "#24130916";
      lctx.fillRect(random() * 256, random() * 192, 1, 1);
    }
    lctx.strokeStyle = "#654026";
    lctx.lineWidth = 3;
    lctx.setLineDash([8, 7]);
    lctx.strokeRect(15, 15, 226, 162);
    lctx.setLineDash([]);
    // Small debossed tree emblem visible in the manufacturer's detail photo.
    lctx.lineWidth = 5;
    lctx.beginPath();
    lctx.moveTo(128, 145);
    lctx.lineTo(128, 45);
    for (let i = 0; i < 3; i++) {
      const y = 63 + i * 23;
      lctx.moveTo(99 - i * 5, y - 15);
      lctx.lineTo(128, y + 13);
      lctx.lineTo(157 + i * 5, y - 15);
    }
    lctx.stroke();
    const labelMap = new THREE.CanvasTexture(label);
    labelMap.encoding = THREE.sRGBEncoding;
    labelMap.anisotropy = anisotropy;
    const leather = new THREE.MeshStandardMaterial({
      map: labelMap,
      roughness: 0.88,
    });
    const tab = new THREE.Mesh(slab(49, 35, 2, 5), leather);
    tab.name = "Tan leather tab with stitching and debossed tree";
    tab.position.set(width / 2 - 21, NordikDeskMat.surfaceY, 0);
    tab.castShadow = tab.receiveShadow = true;
    this.add(tab);
  }
}
