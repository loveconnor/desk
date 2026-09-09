import { test, expect } from "@playwright/test";
import { clockHandAngles } from "../src/Application/World/clockTime";

test("clock hands show local time with a millisecond-accurate seconds sweep", () => {
  const angles = clockHandAngles(new Date(2026, 8, 9, 15, 30, 15, 500));
  const degrees = angles.map((angle) => (-angle * 180) / Math.PI);
  expect(degrees[0]).toBeCloseTo(105.1291667);
  expect(degrees[1]).toBeCloseTo(181.55);
  expect(degrees[2]).toBeCloseTo(93);
});

test("clock wraps at midnight and resamples correctly after a pause or time change", () => {
  const before = clockHandAngles(new Date(2026, 8, 9, 23, 59, 59, 999));
  for (const angle of before) expect(angle).toBeCloseTo(-2 * Math.PI, 3);
  for (const angle of clockHandAngles(new Date(2026, 8, 10, 0, 0, 0))) {
    expect(Math.abs(angle)).toBe(0);
  }
  const resumed = clockHandAngles(new Date(2026, 8, 10, 6, 0, 30));
  expect(resumed[2]).toBeCloseTo(-Math.PI);
  expect(resumed[1]).toBeCloseTo(-Math.PI / 60);
  expect(resumed[0]).toBeCloseTo(-Math.PI - Math.PI / 720);
});
