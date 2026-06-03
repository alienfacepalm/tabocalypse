import { describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import {
  fetchAllLakesBuoys,
  lakesAllBuoyDataApiUrl,
  lakesBearerAuthorizationHeader,
  lakesBuoyDisplayLabel,
  lakesBuoyIdFromLocation,
  LAKES_API_KEY_REQUIRED_MESSAGE,
  parseAllLakesBuoysPayload,
  parseLakesBuoyPayload,
  type ILakesBuoySnapshot,
} from "./fetch-lakes-buoy-data";

const SAMPLE_BUOY = {
  location: "Lake Sammamish Buoy",
  tempC: 19.45,
  tempF: 67,
  airTempC: 25,
  airTempF: 77,
  windSpeed: 2.8,
  humidity: 28,
  condition: "Moderate",
  status: "ACTIVE",
  timestamp: "6/2/2026 2:02:00 PM",
} as const;

const SAMPLE_WASHINGTON = {
  location: "Lake Washington Buoy",
  tempC: 17.73,
  tempF: 64,
  airTempC: 24.4,
  airTempF: 76,
  windSpeed: 0.7,
  humidity: 28,
  condition: "Overcast",
  status: "ACTIVE",
  timestamp: "6/2/2026 1:02:00 PM",
} as const;

describe("lakesAllBuoyDataApiUrl", () => {
  it("returns the all-buoy-data endpoint", () => {
    expect(lakesAllBuoyDataApiUrl()).toBe("https://2lakes.app/api/all-buoy-data");
  });
});

describe("lakesBearerAuthorizationHeader", () => {
  it("builds Authorization Bearer headers", () => {
    expect(lakesBearerAuthorizationHeader("abc123")).toEqual({
      Authorization: "Bearer abc123",
    });
    expect(lakesBearerAuthorizationHeader("Bearer abc123")).toEqual({
      Authorization: "Bearer abc123",
    });
    expect(lakesBearerAuthorizationHeader("  ")).toEqual({});
  });
});

describe("fetchAllLakesBuoys key requirement", () => {
  it("requires a stored API key before fetching", async () => {
    await expect(fetchAllLakesBuoys("fahrenheit", "")).rejects.toThrow(
      LAKES_API_KEY_REQUIRED_MESSAGE,
    );
  });
});

describe("parseLakesBuoyPayload", () => {
  it("reads Fahrenheit fields when requested", () => {
    const snap = parseLakesBuoyPayload(SAMPLE_BUOY, "fahrenheit");
    expect(snap).toEqual({
      location: "Lake Sammamish Buoy",
      waterTemp: 67,
      airTemp: 77,
      windSpeed: 2.8,
      humidity: 28,
      condition: "Moderate",
      status: "ACTIVE",
      timestamp: "6/2/2026 2:02:00 PM",
      temperatureUnit: "fahrenheit",
    } satisfies ILakesBuoySnapshot);
  });

  it("reads Celsius fields when requested", () => {
    const snap = parseLakesBuoyPayload(SAMPLE_BUOY, "celsius");
    expect(snap.waterTemp).toBe(19.45);
    expect(snap.airTemp).toBe(25);
    expect(snap.temperatureUnit).toBe("celsius");
  });

  it("rejects incomplete payloads", () => {
    expect(() => parseLakesBuoyPayload({ tempF: 67 }, "fahrenheit")).toThrow(/Bad buoy/);
    expect(() => parseLakesBuoyPayload(null, "fahrenheit")).toThrow(/Bad buoy/);
  });
});

describe("parseAllLakesBuoysPayload", () => {
  it("maps an array of buoy objects into accordion rows", () => {
    const rows = parseAllLakesBuoysPayload([SAMPLE_BUOY, SAMPLE_WASHINGTON], "fahrenheit");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe("lake-sammamish-buoy");
    expect(rows[0]?.label).toBe("Lake Sammamish");
    expect(rows[1]?.label).toBe("Lake Washington");
  });

  it("accepts a wrapped buoys array", () => {
    const rows = parseAllLakesBuoysPayload({ buoys: [SAMPLE_BUOY] }, "fahrenheit");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data.waterTemp).toBe(67);
  });

  it("surfaces API error payloads", () => {
    expect(() =>
      parseAllLakesBuoysPayload(
        { error: "Unauthorized", message: "External access requires an API Key." },
        "fahrenheit",
      ),
    ).toThrow(/API Key/);
  });
});

describe("lakes buoy labels", () => {
  it("derives stable ids and display labels", () => {
    expect(lakesBuoyIdFromLocation("Lake Sammamish Buoy")).toBe("lake-sammamish-buoy");
    expect(lakesBuoyDisplayLabel("Lake Sammamish Buoy")).toBe("Lake Sammamish");
  });
});
