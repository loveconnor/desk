// Touch devices need a smaller decode/GPU budget even in landscape or inside
// the desktop iframe, whose viewport is wider than the physical phone screen.
export const compactGraphics = window.matchMedia("(pointer: coarse)").matches;
export const maxPixelRatio = compactGraphics ? 1 : 2;
