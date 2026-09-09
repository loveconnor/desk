/** Original Air75 / COAST Twilight, from NuPhy's 2021 layout drawing.
 * Widths are standard key units; the 84-key matrix spans 16 units per row.
 */
export type Air75Key = {
  code: string;
  units: number;
  x: number;
  row: number;
  tone: "alpha" | "modifier" | "teal" | "orange" | "yellow";
};
type Entry = string | [string, number];
const rows: Entry[][] = [
  [
    "Escape",
    ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`),
    "PrintScreen",
    "Sleep",
    "Delete",
  ],
  [
    "Backquote",
    ..."1234567890".split("").map((n) => `Digit${n}`),
    "Minus",
    "Equal",
    ["Backspace", 2],
    "PageUp",
  ],
  [
    ["Tab", 1.5],
    ..."QWERTYUIOP".split("").map((n) => `Key${n}`),
    "BracketLeft",
    "BracketRight",
    ["Backslash", 1.5],
    "PageDown",
  ],
  [
    ["CapsLock", 1.75],
    ..."ASDFGHJKL".split("").map((n) => `Key${n}`),
    "Semicolon",
    "Quote",
    ["Enter", 2.25],
    "Home",
  ],
  [
    ["ShiftLeft", 2.25],
    ..."ZXCVBNM".split("").map((n) => `Key${n}`),
    "Comma",
    "Period",
    "Slash",
    ["ShiftRight", 1.75],
    "ArrowUp",
    "End",
  ],
  [
    ["ControlLeft", 1.25],
    ["AltLeft", 1.25],
    ["MetaLeft", 1.25],
    ["Space", 6.25],
    "MetaRight",
    "Fn",
    "ControlRight",
    "ArrowLeft",
    "ArrowDown",
    "ArrowRight",
  ],
];
export const AIR75_SIZE = {
  width: 315.7,
  depth: 132.6,
  frontHeight: 16,
  rearHeight: 21,
  pitch: 19.05,
};
export const air75Keys: Air75Key[] = rows.flatMap((entries, row) => {
  let cursor = -8;
  return entries.map((entry) => {
    const [code, units] = typeof entry === "string" ? [entry, 1] : entry;
    const x = cursor + units / 2;
    cursor += units;
    const alpha =
      code.startsWith("Key") ||
      code.startsWith("Digit") ||
      [
        "Minus",
        "Equal",
        "BracketLeft",
        "BracketRight",
        "Backslash",
        "Semicolon",
        "Quote",
        "Comma",
        "Period",
        "Slash",
        "F1",
        "F2",
        "F3",
        "F4",
        "F9",
        "F10",
        "F11",
        "F12",
      ].includes(code);
    const tone =
      code === "Escape"
        ? "teal"
        : code === "Enter"
          ? "orange"
          : code === "Space"
            ? "yellow"
            : alpha
              ? "alpha"
              : "modifier";
    return { code, units, x, row, tone };
  });
});
export const air75Rows = rows.map((entries) =>
  entries.map((entry) => (typeof entry === "string" ? entry : entry[0])),
);
