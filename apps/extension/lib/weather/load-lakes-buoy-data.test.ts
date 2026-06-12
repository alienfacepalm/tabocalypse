import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ILakesBuoyEntry } from "./fetch-lakes-buoy-data";
import { loadLakesBuoyData } from "./load-lakes-buoy-data";
import { WEATHER_DATA_CACHE_STORAGE_KEY } from "./weather-data-cache";

const { fetchAllLakesBuoys, localGet, localSet } = vi.hoisted(() => ({
  fetchAllLakesBuoys: vi.fn(),
  localGet: vi.fn(),
  localSet: vi.fn(),
}));

vi.mock("./fetch-lakes-buoy-data", () => ({
  fetchAllLakesBuoys,
}));

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: { get: localGet, set: localSet },
    },
  },
}));

const sampleBuoys = (): ILakesBuoyEntry[] => [
  {
    id: "lake-washington",
    label: "Lake Washington",
    detailComplete: true,
    data: {
      location: "Lake Washington",
      waterTemp: 64,
      airTemp: 75,
      windSpeed: 3,
      humidity: null,
      condition: "from S · 3 mph",
      status: "ACTIVE",
      timestamp: "2026-06-11",
      temperatureUnit: "fahrenheit",
    },
  },
];

describe("loadLakesBuoyData", () => {
  beforeEach(() => {
    fetchAllLakesBuoys.mockReset();
    localGet.mockReset();
    localSet.mockReset();
    localGet.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns fresh buoy data and writes cache on success", async () => {
    const buoys = sampleBuoys();
    fetchAllLakesBuoys.mockResolvedValue(buoys);

    const result = await loadLakesBuoyData("fahrenheit");

    expect(result.stale).toBe(false);
    expect(result.buoys).toEqual(buoys);
    expect(localSet).toHaveBeenCalledTimes(1);
  });

  it("falls back to cached buoy data when fetch fails", async () => {
    const now = 1_700_000_000_000;
    const buoys = sampleBuoys();
    fetchAllLakesBuoys.mockRejectedValue(new Error("King County feed down"));
    localGet.mockResolvedValue({
      [WEATHER_DATA_CACHE_STORAGE_KEY]: {
        openMeteo: {},
        lakesBuoys: {
          fahrenheit: { payload: buoys, fetchedAt: now },
        },
      },
    });

    const result = await loadLakesBuoyData("fahrenheit");

    expect(result.stale).toBe(true);
    expect(result.fetchedAt).toBe(now);
    expect(result.buoys).toEqual(buoys);
    expect(localSet).not.toHaveBeenCalled();
  });

  it("rethrows when fetch fails and cache is empty", async () => {
    fetchAllLakesBuoys.mockRejectedValue(new Error("No active buoy data returned"));

    await expect(loadLakesBuoyData("fahrenheit")).rejects.toThrow("No active buoy data returned");
  });
});
