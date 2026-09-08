import * as THREE from "three";
import { keyRows } from "./KeyboardState";

const labels: Record<string, string> = {
  Backquote: "~\n`",
  Minus: "_\n-",
  Equal: "+\n=",
  Backspace: "⌫",
  Escape: "esc",
  Tab: "tab",
  BracketLeft: "{\n[",
  BracketRight: "}\n]",
  Backslash: "|\n\\",
  Delete: "del",
  CapsLock: "caps",
  Semicolon: ":\n;",
  Quote: "\"\n'",
  Enter: "enter",
  Home: "home",
  PageUp: "pgup",
  ShiftLeft: "shift",
  ShiftRight: "shift",
  Comma: "<\n,",
  Period: ">\n.",
  Slash: "?\n/",
  End: "end",
  PageDown: "pgdn",
  ControlLeft: "ctrl",
  ControlRight: "ctrl",
  MetaLeft: "⌘",
  MetaRight: "⌘",
  AltLeft: "alt",
  AltRight: "alt",
  ArrowLeft: "←",
  ArrowDown: "↓",
  ArrowRight: "→",
  ArrowUp: "↑",
};

/** Shared high-resolution printing atlas; each legend moves with its keycap. */
export function keyLegendAtlas(renderer: THREE.WebGLRenderer) {
  const codes = keyRows.flat().filter(Boolean);
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  codes.forEach((code, index) => {
    const x = (index % 16) * 128 + 64;
    const y = Math.floor(index / 16) * 128;
    const label = code.startsWith("Key")
      ? code.slice(3)
      : code.startsWith("Digit")
        ? ")!@#$%^&*("[Number(code.slice(5))] + "\n" + code.slice(5)
        : labels[code] || code;
    ctx.fillStyle = ["Escape", "Backspace"].includes(code)
      ? "#242629"
      : "#f1f1e8";
    const lines = label.split("\n");
    ctx.font = `500 ${lines.length > 1 ? 43 : label.length > 2 ? 35 : 69}px Arial`;
    lines.forEach((line, i) =>
      ctx.fillText(line, x, y + (lines.length > 1 ? 38 + i * 51 : 65)),
    );
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  return (code: string) => {
    const index = codes.indexOf(code);
    const geometry = new THREE.PlaneGeometry(43, 43);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(
        i,
        ((index % 16) + uv.getX(i)) / 16,
        1 - (Math.floor(index / 16) + 1 - uv.getY(i)) / 5,
      );
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${code} printed legend`;
    return mesh;
  };
}
