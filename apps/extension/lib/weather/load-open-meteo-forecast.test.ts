import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IWeatherForecast } from "./fetch-weather";
import { loadOpenMeteoForecast } from "./load-open-meteo-forecast";
import { WEATHER_DATA_CACHE_STORAGE_KEY } from "./weather-data-cache";

const { fetchOpenMeteo, localGet, localSet } = vi.hoisted(() => ({
  fetchOpenMeteo: vi.fn(),
  localGet: vi.fn(),
  localSet: vi.fn(),
}));

vi.mock("./fetch-weather", () => ({
  fetchOpenMeteo,
}));

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: { get: localGet, set: localSet },
    },
  },
}));

const sampleForecast = (): IWeatherForecast => ({
  current: {
    temperature: 18,
    temperatureUnit: "celsius",
    code: 2,
    summary: "Partly cloudy",
  },
  daily: [
    {
      date: "2026-06-11",
      code: 2,
      summary: "Partly cloudy",
      high: 22,
      low: 14,
      precipChancePercent: 10,
      precipSum: 0,
      windSpeedMax: 8,
      windDirectionDegrees: 180,
      uvIndexMax: 5,
      sunrise: "05:42",
      sunset: "20:18",
      feelsLikeHigh: 21,
      feelsLikeLow: 13,
    },
  ],
});

describe("loadOpenMeteoForecast", () => {
  beforeEach(() => {
    fetchOpenMeteo.mockReset();
    localGet.mockReset();
    localSet.mockReset();
    localGet.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns fresh forecast and writes cache on success", async () => {
    const forecast = sampleForecast();
    fetchOpenMeteo.mockResolvedValue(forecast);

    const result = await loadOpenMeteoForecast(47.6, -122.3, "celsius");

    expect(result.stale).toBe(false);
    expect(result.forecast).toEqual(forecast);
    expect(localSet).toHaveBeenCalledTimes(1);
  });

  it("falls back to cached forecast when fetch fails", async () => {
    const now = 1_700_000_000_000;
    const forecast = sampleForecast();
    const key = "47.6000:-122.3000:celsius";
    fetchOpenMeteo.mockRejectedValue(new Error("Network error"));
    localGet.mockResolvedValue({
      [WEATHER_DATA_CACHE_STORAGE_KEY]: {
        openMeteo: { [key]: { payload: forecast, fetchedAt: now } },
        lakesBuoys: {},
      },
    });

    const result = await loadOpenMeteoForecast(47.6, -122.3, "celsius");

    expect(result.stale).toBe(true);
    expect(result.fetchedAt).toBe(now);
    expect(result.forecast).toEqual(forecast);
    expect(localSet).not.toHaveBeenCalled();
  });

  it("rethrows when fetch fails and no cache exists", async () => {
    fetchOpenMeteo.mockRejectedValue(new Error("Service unavailable"));

    await expect(loadOpenMeteoForecast(47.6, -122.3, "celsius")).rejects.toThrow(
      "Service unavailable",
    );
  });
});
