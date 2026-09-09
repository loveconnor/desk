/** Dell S3222DGM outline dimensions, millimeters converted to room units. */
export const MONITOR = {
  scale: 2.25,
  width: 708.76 * 2.25,
  height: 424.2 * 2.25,
  // Thin bezel proportions matched to the owner's IMG_1811 photo.
  screenWidth: (708.76 - 6) * 2.25,
  screenHeight: (424.2 - 21) * 2.25,
  radius: 1800 * 2.25,
  top: 352.5 + 455.98 * 2.25,
  screenY: 352.5 + (455.98 - 3 - (424.2 - 21) / 2) * 2.25,
  z: -260,
  shelfY: 352.5,
};
export const monitorSag = (x: number) =>
  MONITOR.radius - Math.sqrt(MONITOR.radius ** 2 - x ** 2);
