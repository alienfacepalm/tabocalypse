import { describe, expect, it } from "vitest";
import { getAnalogClockAngles } from "./clock-analog-angles";

describe("getAnalogClockAngles", () => {
  it("returns zeroed hands at local noon in UTC", () => {
    const angles = getAnalogClockAngles(new Date("2026-06-17T12:00:00.000Z"), "UTC");
    expect(angles.hourDeg).toBeCloseTo(0, 5);
    expect(angles.minuteDeg).toBeCloseTo(0, 5);
    expect(angles.secondDeg).toBeCloseTo(0, 5);
  });

  it("maps 18:14:51 in America/Los_Angeles to expected hand angles", () => {
    const angles = getAnalogClockAngles(
      new Date("2026-06-18T01:14:51.000Z"),
      "America/Los_Angeles",
    );
    expect(angles.secondDeg).toBeCloseTo(51 * 6, 5);
    expect(angles.minuteDeg).toBeCloseTo((14 + 51 / 60) * 6, 5);
    expect(angles.hourDeg).toBeCloseTo((6 + 14 / 60 + 51 / 3600) * 30, 5);
  });

  it("uses fractional seconds for smooth second-hand motion", () => {
    const angles = getAnalogClockAngles(new Date("2026-06-17T12:00:30.500Z"), "UTC");
    expect(angles.secondDeg).toBeCloseTo(30.5 * 6, 5);
  });
});
