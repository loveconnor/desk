import * as THREE from "three";
import { air75Keys } from "./Air75Layout";

const labels: Record<string, string> = {
  Backquote: "~\n`",
  Minus: "_\n-",
  Equal: "+\n=",
  Backspace: "BACKSPACE",
  Escape: "ESC",
  Tab: "TAB",
  BracketLeft: "{\n[",
  BracketRight: "}\n]",
  Backslash: "|\n\\",
  Delete: "DEL",
  CapsLock: "CAPS",
  Semicolon: ":\n;",
  Quote: "\"\n'",
  Enter: "ENTER",
  Home: "HOME",
  PageUp: "PGUP",
  PageDown: "PGDN",
  End: "END",
  Comma: "<\n,",
  Period: ">\n.",
  Slash: "?\n/",
  ShiftLeft: "SHIFT",
  ShiftRight: "SHIFT",
  ControlLeft: "CTRL",
  ControlRight: "CTRL",
  MetaLeft: "CMD",
  MetaRight: "CMD",
  AltLeft: "OPT",
  Fn: "FN",
  ArrowLeft: "‹",
  ArrowDown: "⌄",
  ArrowRight: "›",
  ArrowUp: "⌃",
  PrintScreen: "✂",
  Sleep: "⏏",
};
const functions = [
  "◐",
  "☼",
  "▣",
  "▦",
  "●",
  "☀",
  "◀◀",
  "▶Ⅱ",
  "▶▶",
  "×",
  "◖",
  "◖))",
];

/** A single lit printing atlas; geometry conforms to the cap's shallow dish. */
export function keyLegendAtlas(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  air75Keys.forEach(({ code }, index) => {
    if (code === "Space") return;
    const x = (index % 16) * 128 + 64,
      y = Math.floor(index / 16) * 128;
    const label = code.startsWith("Key")
      ? code.slice(3)
      : code.startsWith("Digit")
        ? ")!@#$%^&*("[Number(code.slice(5))] + "\n" + code.slice(5)
        : /^F\d+$/.test(code)
          ? functions[Number(code.slice(1)) - 1] + "\n" + code
          : labels[code] || code;
    ctx.fillStyle = "#f1f1ed";
    const lines = label.split("\n");
    ctx.font = `500 ${lines.length > 1 ? 34 : label.length > 3 ? 22 : label.length > 1 ? 29 : 57}px Arial`;
    lines.forEach((line, i) =>
      ctx.fillText(line, x, y + (lines.length > 1 ? 39 + i * 49 : 64), 116),
    );
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    roughness: 0.86,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  return (
    code: string,
    width: number,
    heightAt: (x: number, z: number) => number,
  ) => {
    const index = air75Keys.findIndex((key) => key.code === code);
    const geometry = new THREE.PlaneGeometry(
      Math.min(width - 4, code === "Backspace" ? 27 : 15),
      13,
      8,
      8,
    );
    geometry.rotateX(-Math.PI / 2);
    const p = geometry.attributes.position,
      uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      p.setY(i, heightAt(p.getX(i), p.getZ(i)) + 0.14);
      uv.setXY(
        i,
        ((index % 16) + uv.getX(i)) / 16,
        1 - (Math.floor(index / 16) + 1 - uv.getY(i)) / 6,
      );
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${code} printed legend`;
    return mesh;
  };
}
