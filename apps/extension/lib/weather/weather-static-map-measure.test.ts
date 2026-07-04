import { describe, expect, it } from "vitest";
import {
  WEATHER_STATIC_MAP_WIDTH,
  resolveWeatherStaticMapDimensions,
} from "./weather-static-map-url";
import {
  WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS,
  areWeatherStaticMapLayoutsEqual,
  isWeatherStaticMapImageDimensionallySynced,
  isWeatherStaticMapImageDisplayed,
  resolveWeatherStaticMapLayout,
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

describe("resolveWeatherStaticMapLayout", () => {
  it("returns null until the container has a measurable width", () => {
    expect(resolveWeatherStaticMapLayout(0, "0,0,1920,1080")).toBeNull();
    expect(resolveWeatherStaticMapLayout(-1, "0,0,1920,1080")).toBeNull();
  });

  it("pairs the live container width with matching fetch dimensions", () => {
    const layout = resolveWeatherStaticMapLayout(320, "0,0,1920,1080");
    expect(layout).toEqual({
      containerWidthPx: 320,
      displayKey: "0,0,1920,1080",
      dimensions: resolveWeatherStaticMapDimensions(320),
    });
  });
});

describe("areWeatherStaticMapLayoutsEqual", () => {
  it("detects monitor-resize layout changes", () => {
    const narrow = resolveWeatherStaticMapLayout(320, "0,0,1920,1080");
    const wide = resolveWeatherStaticMapLayout(480, "0,0,1920,1080");
    expect(areWeatherStaticMapLayoutsEqual(narrow, wide)).toBe(false);
    expect(areWeatherStaticMapLayoutsEqual(narrow, narrow)).toBe(true);
  });

  it("detects monitor moves that keep the same panel width", () => {
    const primary = resolveWeatherStaticMapLayout(320, "0,0,1920,1080");
    const secondary = resolveWeatherStaticMapLayout(320, "1920,0,2560,1440");
    expect(areWeatherStaticMapLayoutsEqual(primary, secondary)).toBe(false);
  });
});

describe("isWeatherStaticMapImageDimensionallySynced", () => {
  it("rejects stale tiles fetched for a different panel width", () => {
    const layout = resolveWeatherStaticMapLayout(320, "0,0,1920,1080");
    expect(layout).not.toBeNull();
    if (!layout) {
      return;
    }
    const stale = {
      complete: true,
      naturalWidth: 600,
    } as HTMLImageElement;
    const fresh = {
      complete: true,
      naturalWidth: layout.dimensions.fetchWidth,
    } as HTMLImageElement;
    expect(isWeatherStaticMapImageDimensionallySynced(layout, stale)).toBe(false);
    expect(isWeatherStaticMapImageDimensionallySynced(layout, fresh)).toBe(true);
  });
});
