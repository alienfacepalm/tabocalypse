import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

const { privilegedExtensionFetchText } = vi.hoisted(() => ({
  privilegedExtensionFetchText: vi.fn(),
}));

vi.mock("../privileged-extension-fetch", () => ({
  privilegedExtensionFetchText,
}));

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import {
  fetchAllLakesBuoys,
  KING_COUNTY_LAKE_BUOY_MAP_DATA_URL,
  LAKES_BUOY_STATUS_ACTIVE,
  LAKES_BUOY_STATUS_WATER_TEMP_MISSING,
  lakesBuoyDisplayLabel,
  lakesBuoyIdFromLocation,
  mapKingCountyRowsToBuoyEntries,
  type ILakesBuoySnapshot,
} from "./fetch-lakes-buoy-data";
import { parseKingCountyLakeBuoyMapData } from "./parse-king-county-lake-buoy-map-data";

const FIXTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "king-county-map-data.fixture.txt",
);

describe("mapKingCountyRowsToBuoyEntries", () => {
  it("maps active lakes to accordion rows with converted units", () => {
    const text = readFileSync(FIXTURE_PATH, "utf8");
    const rows = mapKingCountyRowsToBuoyEntries(parseKingCountyLakeBuoyMapData(text), "fahrenheit");

    expect(rows).toHaveLength(2);
    expect(rows[0]?.label).toBe("Lake Sammamish");
    expect(rows[0]?.data.waterTemp).toBe(67);
    expect(rows[0]?.data.airTemp).toBe(80);
    expect(rows[0]?.data.windSpeed).toBe(5);
    expect(rows[0]?.data.humidity).toBeNull();
    expect(rows[0]?.data.condition).toContain("from E");
    expect(rows[0]?.detailComplete).toBe(true);
  });

  it("maps Celsius when requested", () => {
    const text = readFileSync(FIXTURE_PATH, "utf8");
    const rows = mapKingCountyRowsToBuoyEntries(parseKingCountyLakeBuoyMapData(text), "celsius");
    const snap = rows.find((row) => row.label === "Lake Washington")?.data;
    expect(snap?.waterTemp).toBe(17.73);
    expect(snap?.temperatureUnit).toBe("celsius");
  });

  it("throws when no active lakes are returned", () => {
    expect(() =>
      mapKingCountyRowsToBuoyEntries(
        [
          {
            name: "RUSS",
            active: false,
            collectDate: null,
            airTempC: null,
            windSpeedMps: null,
            windDirection: null,
            waterTempC: null,
            profileDate: null,
            latitude: null,
            longitude: null,
          },
        ],
        "fahrenheit",
      ),
    ).toThrow(/No active buoy/);
  });

  it("keeps active lakes when water temperature is temporarily missing", () => {
    const rows = mapKingCountyRowsToBuoyEntries(
      [
        {
          name: "Sammamish",
          active: true,
          collectDate: null,
          airTempC: null,
          windSpeedMps: null,
          windDirection: "NA",
          waterTempC: null,
          profileDate: null,
          latitude: 47.58167,
          longitude: -122.09,
        },
        {
          name: "Washington",
          active: true,
          collectDate: null,
          airTempC: null,
          windSpeedMps: null,
          windDirection: "NA",
          waterTempC: null,
          profileDate: null,
          latitude: 47.61222,
          longitude: -122.25428,
        },
      ],
      "fahrenheit",
    );

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.data.waterTemp == null)).toBe(true);
    expect(rows.every((row) => row.data.status === LAKES_BUOY_STATUS_WATER_TEMP_MISSING)).toBe(
      true,
    );
  });
});

describe("fetchAllLakesBuoys", () => {
  it("requests King County map data as plain text", async () => {
    const fixture = readFileSync(FIXTURE_PATH, "utf8");
    privilegedExtensionFetchText.mockReset();
    privilegedExtensionFetchText.mockResolvedValue(fixture);

    const rows = await fetchAllLakesBuoys("fahrenheit");

    expect(privilegedExtensionFetchText).toHaveBeenCalledWith(
      KING_COUNTY_LAKE_BUOY_MAP_DATA_URL,
      undefined,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.data).toMatchObject({
      temperatureUnit: "fahrenheit",
      status: LAKES_BUOY_STATUS_ACTIVE,
    } satisfies Partial<ILakesBuoySnapshot>);
  });

  it("maps the live King County feed shape when sensors are quiet", async () => {
    const liveShape =
      "Sammamish|\t|\t|\t|\tNA|\t|\t|\t47.58167|\t-122.09000|\tY^|Washington|\t|\t|\t|\tNA|\t|\t|\t47.61222|\t-122.25428|\tY^|";
    privilegedExtensionFetchText.mockReset();
    privilegedExtensionFetchText.mockResolvedValue(liveShape);

    const rows = await fetchAllLakesBuoys("fahrenheit");

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.data.status === LAKES_BUOY_STATUS_WATER_TEMP_MISSING)).toBe(
      true,
    );
  });
});

describe("lakes buoy labels", () => {
  it("derives stable ids and display labels", () => {
    expect(lakesBuoyIdFromLocation("Lake Sammamish")).toBe("lake-sammamish");
    expect(lakesBuoyDisplayLabel("Lake Sammamish")).toBe("Lake Sammamish");
  });
});
