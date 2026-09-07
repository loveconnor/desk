/** Physical codes keep the desk keys aligned even with Shift or another layout. */
export const keyRows = [
  [
    "Backquote",
    ..."1234567890".split("").map((n) => `Digit${n}`),
    "Minus",
    "Equal",
    "Backspace",
    "Escape",
  ],
  [
    "Tab",
    ..."QWERTYUIOP".split("").map((n) => `Key${n}`),
    "BracketLeft",
    "BracketRight",
    "Backslash",
    "Delete",
  ],
  [
    "CapsLock",
    ..."ASDFGHJKL".split("").map((n) => `Key${n}`),
    "Semicolon",
    "Quote",
    "Enter",
    "Home",
    "PageUp",
  ],
  [
    "ShiftLeft",
    ..."ZXCVBNM".split("").map((n) => `Key${n}`),
    "Comma",
    "Period",
    "Slash",
    "ShiftRight",
    "ArrowUp",
    "End",
    "PageDown",
  ],
  [
    "ControlLeft",
    "MetaLeft",
    "AltLeft",
    "",
    "",
    "",
    "",
    "",
    "",
    "AltRight",
    "MetaRight",
    "ControlRight",
    "ArrowLeft",
    "ArrowDown",
    "ArrowRight",
  ],
];
export class KeyboardState {
  pressed = new Set<string>();
  listeners = new Set<(code: string) => void>();
  down(event: Pick<KeyboardEvent, "key" | "code" | "repeat">) {
    if (
      !event.code ||
      event.key?.includes("_AUTO_") ||
      event.repeat ||
      this.pressed.has(event.code)
    )
      return;
    this.pressed.add(event.code);
    this.listeners.forEach((listener) => listener(event.code));
  }
  up(event: Pick<KeyboardEvent, "code">) {
    this.pressed.delete(event.code);
    // macOS may omit keyup for keys used in a Command shortcut.
    if (event.code?.startsWith("Meta")) this.reset();
  }
  reset() {
    this.pressed.clear();
  }
}
export const keyboardState = new KeyboardState();
export function bindKeyboard(state = keyboardState) {
  const down = (e: KeyboardEvent) => state.down(e);
  const up = (e: KeyboardEvent) => state.up(e);
  const reset = () => state.reset();
  document.addEventListener("keydown", down, true);
  document.addEventListener("keyup", up, true);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", reset);
  document.addEventListener("keyboard-reset", reset);
  return () => {
    document.removeEventListener("keydown", down, true);
    document.removeEventListener("keyup", up, true);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", reset);
    document.removeEventListener("keyboard-reset", reset);
    reset();
  };
}
