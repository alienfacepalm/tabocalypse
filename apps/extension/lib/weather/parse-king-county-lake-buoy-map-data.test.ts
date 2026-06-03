import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  kingCountyCelsiusToFahrenheit,
  kingCountyWindMetersPerSecToMph,
  parseKingCountyLakeBuoyMapData,
} from "./parse-king-county-lake-buoy-map-data";

const FIXTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "king-county-map-data.fixture.txt",
);

describe("parseKingCountyLakeBuoyMapData", () => {
  it("parses active lakes from the committed fixture", () => {
    const text = readFileSync(FIXTURE_PATH, "utf8");
    const rows = parseKingCountyLakeBuoyMapData(text);
    const active = rows.filter((row) => row.active);

    expect(active).toHaveLength(2);
    expect(active.map((row) => row.name).sort()).toEqual(["Sammamish", "Washington"]);

    const sammamish = active.find((row) => row.name === "Sammamish");
    expect(sammamish?.waterTempC).toBe(19.45);
    expect(sammamish?.airTempC).toBe(26.7);
    expect(sammamish?.windSpeedMps).toBe(2.1);
    expect(sammamish?.windDirection).toBe("from E");
    expect(sammamish?.latitude).toBeCloseTo(47.58167, 4);
  });

  it("includes inactive RUSS stations", () => {
    const text = readFileSync(FIXTURE_PATH, "utf8");
    const rows = parseKingCountyLakeBuoyMapData(text);
    const inactive = rows.filter((row) => !row.active);
    expect(inactive.length).toBeGreaterThanOrEqual(4);
    expect(inactive.every((row) => row.waterTempC == null)).toBe(true);
  });
});

describe("king county unit helpers", () => {
  it("converts wind and temperature like the county map", () => {
    expect(kingCountyWindMetersPerSecToMph(2.1)).toBe(5);
    expect(kingCountyCelsiusToFahrenheit(19.45)).toBe(67);
  });
});
