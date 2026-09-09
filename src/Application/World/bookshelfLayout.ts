/** Physical width/height and binding thickness/height for the pictured editions. */
export const bookProportions: [number, number][] = [
  [0.652, 0.14],
  [0.644, 0.1],
  [0.778, 0.09],
  [0.764, 0.12],
  [0.762, 0.11],
  [0.762, 0.1],
  [0.756, 0.1],
  [0.762, 0.19],
  [0.819, 0.1],
  [0.762, 0.14],
  [0.586, 0.09],
  [0.65, 0.21],
  [0.633, 0.13],
  [0.75, 0.08],
  [0.595, 0.055],
  [0.65, 0.07],
  [1, 0.045],
  [0.72, 0.085],
  [0.77, 0.075],
  [0.776, 0.055],
  [0.824, 0.09],
  [0.85, 0.13],
  [0.796, 0.13],
  [0.686, 0.085],
  [0.634, 0.035],
  [0.65, 0.05],
  [0.667, 0.075],
  [0.656, 0.075],
  [0.7, 0.08],
  [0.662, 0.09],
  [0.636, 0.085],
  [0.67, 0.055],
  [0.754, 0.09],
  [0.81, 0.17],
  [0.673, 0.065],
  [0.66, 0.11],
  [0.786, 0.08],
  [0.67, 0.045],
  [0.786, 0.09],
  [0.795, 0.13],
  [0.606, 0.04],
  [0.8, 0.158],
  [0.63, 0.11],
  [1, 0.07],
  [0.66, 0.045],
  [0.612, 0.075],
  [0.65, 0.065],
  [0.636, 0.04],
];

export function bookshelfRow(row: number) {
  const books = Array.from({ length: 12 }, (_, i) => {
    const index = (row - 1) * 12 + i;
    const height = 395 + ((i * 71 + row * 43) % 210);
    const [aspect, binding] = bookProportions[index];
    return {
      index,
      height,
      width: height * aspect,
      thickness: height * binding,
      x: 0,
      y: 0,
      rotationY: Math.PI / 2,
      rotationZ: 0,
    };
  });
  // Five upright books, two piles of three, and one displayed cover.
  // Fill the shelf by composing groups; never stretch a book along its spine.
  const uprightWidth =
    books.slice(0, 5).reduce((sum, b) => sum + b.thickness, 0) + 8;
  const stackA = Math.max(...books.slice(6, 9).map((b) => b.height));
  const stackB = Math.max(...books.slice(9, 12).map((b) => b.height));
  const scale = 1760 / (uprightWidth + stackA + books[5].width + stackB + 60);
  books.forEach((b) => {
    b.height *= scale;
    b.width *= scale;
    b.thickness *= scale;
  });
  let cursor = -880;
  for (const b of books.slice(0, 5)) {
    b.x = cursor + b.thickness / 2;
    b.y = b.height / 2;
    cursor += b.thickness + 2 * scale;
  }
  cursor += 18 * scale;
  const pile = (start: number, span: number) => {
    let top = 0;
    for (const b of books.slice(start, start + 3)) {
      b.x = cursor + (span * scale) / 2;
      b.y = top + b.thickness / 2;
      b.rotationZ = Math.PI / 2;
      top += b.thickness + 2 * scale;
    }
    cursor += (span + 20) * scale;
  };
  pile(6, stackA);
  const displayed = books[5];
  displayed.rotationY = 0;
  displayed.x = cursor + displayed.width / 2;
  displayed.y = displayed.height / 2;
  cursor += displayed.width + 20 * scale;
  pile(9, stackB);
  return books;
}
