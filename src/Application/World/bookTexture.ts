import { assetLoadingManager } from "../Utils/assetLoading";
import * as THREE from "three";
import type { ArtFace } from "./bookArtwork";

// Bound decoded photo/readback memory to one artwork job at a time.
let artworkQueue: Promise<void> = Promise.resolve();
function queueArtwork(render: () => Promise<void>) {
  const job = artworkQueue.then(render);
  // A failed image must not prevent subsequent artwork from loading.
  artworkQueue = job
    .catch(() => {})
    .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  return job;
}
const textures = new Map<string, THREE.CanvasTexture>();

/** Perspective-correct, seam-free sampling of the actual printed face. */
export function loadBookTexture(face: ArtFace, width: number, height: number) {
  const aspect = width / height;
  const key = JSON.stringify([face, aspect.toFixed(3)]);
  const existing = textures.get(key);
  if (existing) return existing;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 8;
  textures.set(key, texture);
  const url = "/room/books/" + face.file;
  const render = async (targetHeight: number) => {
    const photo = await new THREE.ImageLoader(assetLoadingManager).loadAsync(
      url,
    );
    const source = document.createElement("canvas");
    try {
      // Resizing a texture requires a new GPU allocation. Release the previous one.
      texture.dispose();
      canvas.height = targetHeight;
      canvas.width = Math.max(32, Math.round(targetHeight * aspect));
      const context = canvas.getContext("2d")!;
      if (!face.corners) {
        context.drawImage(photo, 0, 0, canvas.width, canvas.height);
      } else {
        source.width = photo.naturalWidth;
        source.height = photo.naturalHeight;
        const sourceContext = source.getContext("2d")!;
        sourceContext.drawImage(photo, 0, 0);
        const pixels = sourceContext.getImageData(
          0,
          0,
          source.width,
          source.height,
        ).data;
        const output = context.createImageData(canvas.width, canvas.height);
        const [p0, p1, p2, p3] = face.corners;
        const dx1 = p1[0] - p2[0],
          dx2 = p3[0] - p2[0];
        const dy1 = p1[1] - p2[1],
          dy2 = p3[1] - p2[1];
        const dx3 = p0[0] - p1[0] + p2[0] - p3[0];
        const dy3 = p0[1] - p1[1] + p2[1] - p3[1];
        const det = dx1 * dy2 - dx2 * dy1;
        const g = Math.abs(det) < 1e-12 ? 0 : (dx3 * dy2 - dx2 * dy3) / det;
        const h = Math.abs(det) < 1e-12 ? 0 : (dx1 * dy3 - dx3 * dy1) / det;
        const a = p1[0] - p0[0] + g * p1[0],
          b = p3[0] - p0[0] + h * p3[0];
        const d = p1[1] - p0[1] + g * p1[1],
          e = p3[1] - p0[1] + h * p3[1];
        for (let y = 0; y < canvas.height; y++) {
          const v = (y + 0.5) / canvas.height;
          for (let x = 0; x < canvas.width; x++) {
            const u = (x + 0.5) / canvas.width,
              divisor = g * u + h * v + 1;
            const sx = Math.max(
              0,
              Math.min(
                source.width - 1,
                ((a * u + b * v + p0[0]) / divisor) * source.width,
              ),
            );
            const sy = Math.max(
              0,
              Math.min(
                source.height - 1,
                ((d * u + e * v + p0[1]) / divisor) * source.height,
              ),
            );
            const ix = Math.floor(sx),
              iy = Math.floor(sy),
              fx = sx - ix,
              fy = sy - iy;
            const right = Math.min(ix + 1, source.width - 1),
              bottom = Math.min(iy + 1, source.height - 1);
            const offsets = [
              (iy * source.width + ix) * 4,
              (iy * source.width + right) * 4,
              (bottom * source.width + ix) * 4,
              (bottom * source.width + right) * 4,
            ];
            const dest = (y * canvas.width + x) * 4;
            for (let c = 0; c < 4; c++)
              output.data[dest + c] =
                (pixels[offsets[0] + c] * (1 - fx) +
                  pixels[offsets[1] + c] * fx) *
                  (1 - fy) +
                (pixels[offsets[2] + c] * (1 - fx) +
                  pixels[offsets[3] + c] * fx) *
                  fy;
          }
        }
        context.putImageData(output, 0, 0);
      }
      texture.needsUpdate = true;
    } finally {
      // Drop full-resolution canvas storage immediately instead of waiting for GC.
      source.width = source.height = 0;
      photo.removeAttribute("src");
    }
  };
  // Download completion alone is not enough: the cropped canvas must be painted.
  const artworkTask = `book-artwork:${key}`;
  assetLoadingManager.itemStart(artworkTask);
  const ready = queueArtwork(() => render(768)).then(
    () => assetLoadingManager.itemEnd(artworkTask),
    (error) => {
      assetLoadingManager.itemError(artworkTask);
      assetLoadingManager.itemEnd(artworkTask);
      console.error(`Could not load book artwork: ${face.file}`, error);
    },
  );
  let resolution = 768;
  let update = ready;
  const setResolution = (height: number) => {
    if (resolution === height) return update;
    resolution = height;
    update = update
      .catch(() => {})
      .then(() => queueArtwork(() => render(height)));
    return update.catch((error) => {
      resolution = 0; // Allow retrying after a transient image failure.
      throw error;
    });
  };
  texture.userData.ensureHighResolution = () => setResolution(2048);
  texture.userData.releaseHighResolution = () => setResolution(768);
  return texture;
}
