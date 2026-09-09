import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  bookshelfRow,
  bookProportions,
} from "../src/Application/World/bookshelfLayout";
import { photographedBookArtwork } from "../src/Application/World/photographedBookArtwork";

test("all 48 books fit inside their shelf without stretching or intersecting", () => {
  const indices: number[] = [];
  for (let row = 1; row <= 4; row++) {
    const books = bookshelfRow(row);
    const bounds = books.map((book) => {
      indices.push(book.index);
      expect(book.width / book.height).toBeCloseTo(
        bookProportions[book.index][0],
      );
      expect(book.thickness / book.height).toBeCloseTo(
        bookProportions[book.index][1],
      );
      expect(book.thickness).toBeGreaterThan(14);
      const w = book.rotationZ
        ? book.height
        : book.rotationY
          ? book.thickness
          : book.width;
      const h = book.rotationZ ? book.thickness : book.height;
      const rect = {
        left: book.x - w / 2,
        right: book.x + w / 2,
        bottom: book.y - h / 2,
        top: book.y + h / 2,
      };
      expect(rect.left).toBeGreaterThanOrEqual(-880.001);
      expect(rect.right).toBeLessThanOrEqual(880.001);
      expect(rect.bottom).toBeGreaterThanOrEqual(-0.001);
      expect(rect.top).toBeLessThan(665);
      return rect;
    });
    bounds.forEach((a, i) =>
      bounds.slice(i + 1).forEach((b) => {
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom);
        expect(overlapX <= 0.001 || overlapY <= 0.001).toBe(true);
      }),
    );
  }
  expect(new Set(indices).size).toBe(48);
});

test("every added book has actual front, back, and spine assets with valid crops", () => {
  for (let index = 11; index < 48; index++) {
    const artwork = photographedBookArtwork[index];
    for (const side of [artwork.front, artwork.back, artwork.spine]) {
      expect(existsSync(`public/room/books/${side.file}`)).toBe(true);
      if (side.corners) {
        expect(side.corners.length).toBe(4);
        side.corners.flat().forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        });
      }
    }
  }
});
