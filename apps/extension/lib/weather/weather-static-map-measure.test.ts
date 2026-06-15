import { describe, expect, it } from "vitest";
import { WEATHER_STATIC_MAP_WIDTH } from "./weather-static-map-url";
import {
  WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS,
  isWeatherStaticMapImageDisplayed,
  resolveWeatherStaticMapMeasureWidth,
  weatherStaticMapRetryDelayMs,
} from "./weather-static-map-measure";

describe("resolveWeatherStaticMapMeasureWidth", () => {
  it("uses the container width when the panel is laid out", () => {
    expect(resolveWeatherStaticMapMeasureWidth(420)).toBe(420);
  });

  it("falls back to the default fetch width on fresh reload before layout", () => {
    expect(resolveWeatherStaticMapMeasureWidth(0)).toBe(WEATHER_STATIC_MAP_WIDTH);
    expect(resolveWeatherStaticMapMeasureWidth(-1)).toBe(WEATHER_STATIC_MAP_WIDTH);
  });
});

describe("isWeatherStaticMapImageDisplayed", () => {
  it("detects cache-complete images that skip onLoad", () => {
    const img = {
      complete: true,
      naturalWidth: 600,
    } as HTMLImageElement;
    expect(isWeatherStaticMapImageDisplayed(img)).toBe(true);
  });

  it("waits for a decoded image", () => {
    const pending = { complete: false, naturalWidth: 0 } as HTMLImageElement;
    const broken = { complete: true, naturalWidth: 0 } as HTMLImageElement;
    expect(isWeatherStaticMapImageDisplayed(pending)).toBe(false);
    expect(isWeatherStaticMapImageDisplayed(broken)).toBe(false);
  });
});

describe("weatherStaticMapRetryDelayMs", () => {
  it("backs off between reload attempts", () => {
    expect(weatherStaticMapRetryDelayMs(0)).toBe(400);
    expect(weatherStaticMapRetryDelayMs(1)).toBe(800);
    expect(WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS).toBeGreaterThan(1);
  });
});
