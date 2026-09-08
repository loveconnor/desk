// Coordinates refer to unmodified source photos, clockwise from top left.
// Keeping UV crops here preserves the actual printed artwork.
export type ArtFace = { file: string; corners?: number[][] };
export const bookArtwork: Record<
  number,
  { front?: ArtFace; back?: ArtFace; spine?: ArtFace }
> = {
  0: {
    back: {
      file: "0-jacket.png",
      corners: [
        [0.017, 0.02],
        [0.45, 0.02],
        [0.45, 0.97],
        [0.017, 0.97],
      ],
    },
    spine: {
      file: "0-jacket.png",
      corners: [
        [0.453, 0.02],
        [0.547, 0.02],
        [0.547, 0.97],
        [0.453, 0.97],
      ],
    },
  },
  1: {
    back: {
      file: "1-back.jpg",
      corners: [
        [0.229, 0.141],
        [0.675, 0.102],
        [0.592, 0.973],
        [0.237, 0.795],
      ],
    },
    spine: {
      file: "1-back.jpg",
      corners: [
        [0.677, 0.102],
        [0.718, 0.11],
        [0.628, 0.958],
        [0.594, 0.973],
      ],
    },
  },
  2: {
    front: {
      file: "2.jpg",
      corners: [
        [0.204, 0.12],
        [0.795, 0.12],
        [0.795, 0.881],
        [0.204, 0.881],
      ],
    },
    back: {
      file: "2-back.jpg",
      corners: [
        [0.112, 0],
        [0.888, 0],
        [0.888, 1],
        [0.112, 1],
      ],
    },
  },
  3: { back: { file: "3-back.jpg" } },
  4: {
    spine: {
      file: "4-spine.jpg",
      corners: [
        [0.023, 0.38],
        [0.023, 0.06],
        [0.984, 0.06],
        [0.984, 0.4],
      ],
    },
    back: {
      file: "4-back.jpg",
      corners: [
        [0.203, 0.061],
        [0.834, 0.078],
        [0.834, 0.945],
        [0.184, 0.941],
      ],
    },
  },
  6: {
    back: { file: "6-back.jpg" },
    spine: {
      file: "6-spine.jpg",
      corners: [
        [0.548, 0.058],
        [0.616, 0.054],
        [0.621, 0.94],
        [0.564, 0.968],
      ],
    },
  },
  7: { back: { file: "7-back.jpg" } },
  8: {
    front: {
      file: "8.jpg",
      corners: [
        [0.138, 0.144],
        [0.884, 0.143],
        [0.881, 0.873],
        [0.138, 0.865],
      ],
    },
  },
};
