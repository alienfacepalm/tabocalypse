import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ILakesBuoyEntry } from "./fetch-lakes-buoy-data";
import type { IWeatherForecast } from "./fetch-weather";
import {
  formatCoordinateForWeatherCacheKey,
  lakesBuoyWeatherCacheKey,
  openMeteoWeatherCacheKey,
  readLakesBuoyWeatherCache,
  readOpenMeteoWeatherCache,
  WEATHER_DATA_CACHE_STORAGE_KEY,
  writeLakesBuoyWeatherCache,
  writeOpenMeteoWeatherCache,
} from "./weather-data-cache";

const { mockBrowser, localGet, localSet } = vi.hoisted(() => {
  const localGet = vi.fn();
  const localSet = vi.fn();
  const mockBrowser = {
    storage: {
      local: { get: localGet, set: localSet },
    },
  };
  return { mockBrowser, localGet, localSet };
});

vi.mock("webextension-polyfill", () => ({
  default: mockBrowser,
}));

const sampleForecast = (): IWeatherForecast => ({
  current: {
    temperature: 72,
    temperatureUnit: "fahrenheit",
    code: 0,
    summary: "Clear",
    feelsLike: null,
    windSpeed: null,
    windDirectionDegrees: null,
    relativeHumidityPercent: null,
    precipitation: null,
  },
  daily: [
    {
      date: "2026-06-11",
      code: 0,
      summary: "Clear",
      high: 80,
      low: 60,
      precipChancePercent: null,
      precipSum: null,
      windSpeedMax: null,
      windDirectionDegrees: null,
      uvIndexMax: null,
      sunrise: null,
      sunset: null,
      feelsLikeHigh: null,
      feelsLikeLow: null,
    },
  ],
});

const sampleBuoys = (): ILakesBuoyEntry[] => [
  {
    id: "lake-sammamish",
    label: "Lake Sammamish",
    detailComplete: true,
    data: {
      location: "Lake Sammamish",
      waterTemp: 67,
      airTemp: 80,
      windSpeed: 5,
      humidity: null,
      condition: "from E · 5 mph",
      status: "ACTIVE",
      timestamp: "2026-06-11",
      temperatureUnit: "fahrenheit",
    },
  },
];

describe("weather cache keys", () => {
  it("rounds coordinates and includes temperature unit for Open-Meteo", () => {
    expect(formatCoordinateForWeatherCacheKey(47.60621)).toBe("47.6062");
    expect(openMeteoWeatherCacheKey(47.60621, -122.33207, "celsius")).toBe(
      "47.6062:-122.3321:celsius",
    );
    expect(lakesBuoyWeatherCacheKey("fahrenheit")).toBe("fahrenheit");
  });
});

describe("weather data cache", () => {
  beforeEach(() => {
    localGet.mockReset();
    localSet.mockReset();
    localGet.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads and writes Open-Meteo entries by location and unit", async () => {
    const now = 1_700_000_000_000;
    const forecast = sampleForecast();
    const key = openMeteoWeatherCacheKey(47.6, -122.3, "fahrenheit");

    localGet.mockResolvedValue({
      [WEATHER_DATA_CACHE_STORAGE_KEY]: {
        openMeteo: { [key]: { payload: forecast, fetchedAt: now } },
        lakesBuoys: {},
      },
    });

    const read = await readOpenMeteoWeatherCache(47.6, -122.3, "fahrenheit");
    expect(read?.payload.current.summary).toBe("Clear");
    expect(read?.fetchedAt).toBe(now);

    localGet.mockResolvedValue({
      [WEATHER_DATA_CACHE_STORAGE_KEY]: { openMeteo: {}, lakesBuoys: {} },
    });
    await writeOpenMeteoWeatherCache(47.6, -122.3, "fahrenheit", forecast, now + 1);

    expect(localSet).toHaveBeenCalledTimes(1);
    const payload = localSet.mock.calls[0]![0] as Record<string, unknown>;
    const cache = payload[WEATHER_DATA_CACHE_STORAGE_KEY] as {
      openMeteo: Record<string, { payload: IWeatherForecast; fetchedAt: number }>;
    };
    expect(cache.openMeteo[key]?.fetchedAt).toBe(now + 1);
  });

  it("reads and writes lakes buoy entries by temperature unit", async () => {
    const now = 1_700_000_000_000;
    const buoys = sampleBuoys();
    const key = lakesBuoyWeatherCacheKey("fahrenheit");

    localGet.mockResolvedValue({
      [WEATHER_DATA_CACHE_STORAGE_KEY]: {
        openMeteo: {},
        lakesBuoys: { [key]: { payload: buoys, fetchedAt: now } },
      },
    });

    const read = await readLakesBuoyWeatherCache("fahrenheit");
    expect(read?.payload[0]?.label).toBe("Lake Sammamish");

    localGet.mockResolvedValue({
      [WEATHER_DATA_CACHE_STORAGE_KEY]: { openMeteo: {}, lakesBuoys: {} },
    });
    await writeLakesBuoyWeatherCache("fahrenheit", buoys, now + 2);

    const payload = localSet.mock.calls[0]![0] as Record<string, unknown>;
    const cache = payload[WEATHER_DATA_CACHE_STORAGE_KEY] as {
      lakesBuoys: Record<string, { payload: ILakesBuoyEntry[]; fetchedAt: number }>;
    };
    expect(cache.lakesBuoys[key]?.fetchedAt).toBe(now + 2);
  });

  it("returns null when cache entry is missing", async () => {
    localGet.mockResolvedValue({
      [WEATHER_DATA_CACHE_STORAGE_KEY]: { openMeteo: {}, lakesBuoys: {} },
    });

    expect(await readOpenMeteoWeatherCache(0, 0, "celsius")).toBeNull();
    expect(await readLakesBuoyWeatherCache("celsius")).toBeNull();
  });
});
