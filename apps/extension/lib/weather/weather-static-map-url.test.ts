import { describe, expect, it } from "vitest";
import {
  WEATHER_STATIC_MAP_BRANDING_CROP_RATIO,
  WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  WEATHER_STATIC_MAP_HEIGHT,
  WEATHER_STATIC_MAP_MAX_HEIGHT,
  WEATHER_STATIC_MAP_MAX_WIDTH,
  WEATHER_STATIC_MAP_VISIBLE_HEIGHT,
  WEATHER_STATIC_MAP_LAYER,
  WEATHER_STATIC_MAP_WIDTH,
  buildWeatherStaticMapUrl,
  resolveWeatherStaticMapDimensions,
} from "./weather-static-map-url";

describe("buildWeatherStaticMapUrl", () => {
  it("builds a Yandex hybrid static map URL with pin and English labels", () => {
    const url = buildWeatherStaticMapUrl(47.6062, -122.3321, 11);
    expect(url).toMatch(/^https:\/\/static-maps\.yandex\.ru\/1\.x\/\?/);
    expect(url).toContain("ll=-122.3321,47.6062");
    expect(url).toContain("z=11");
    expect(url).toContain(`l=${WEATHER_STATIC_MAP_LAYER}`);
    expect(url).toContain("pt=-122.3321,47.6062,pm2rdm");
    expect(url).toContain("lang=en_US");
    expect(url).toContain(`size=${WEATHER_STATIC_MAP_WIDTH},${WEATHER_STATIC_MAP_HEIGHT}`);
  });

  it("uses hybrid satellite layer so lakes and rivers render near the pin", () => {
    expect(WEATHER_STATIC_MAP_LAYER).toBe("sat,skl");
  });

  it("accepts measured container dimensions", () => {
    const url = buildWeatherStaticMapUrl(47.6062, -122.3321, 14, {
      fetchWidth: 320,
      fetchHeight: 200,
    });
    expect(url).toContain("size=320,200");
  });

  it("clamps zoom to a sane range", () => {
    expect(buildWeatherStaticMapUrl(0, 0, 0)).toContain("z=1");
    expect(buildWeatherStaticMapUrl(0, 0, 99)).toContain("z=17");
  });

  it("derives visible map height from the branding crop ratio", () => {
    expect(WEATHER_STATIC_MAP_BRANDING_CROP_RATIO).toBeCloseTo(15 / 115);
    expect(WEATHER_STATIC_MAP_VISIBLE_HEIGHT).toBe(
      Math.round(WEATHER_STATIC_MAP_HEIGHT * (1 - WEATHER_STATIC_MAP_BRANDING_CROP_RATIO)),
    );
  });

  it("defaults to a tight zoom around the saved pin", () => {
    expect(WEATHER_STATIC_MAP_DEFAULT_ZOOM).toBeGreaterThanOrEqual(13);
  });
});

describe("resolveWeatherStaticMapDimensions", () => {
  it("matches panel width and keeps the pin-centered visible aspect", () => {
    const dims = resolveWeatherStaticMapDimensions(320);
    expect(dims.fetchWidth).toBe(320);
    expect(dims.visibleHeight).toBe(
      Math.round(dims.fetchHeight * (1 - WEATHER_STATIC_MAP_BRANDING_CROP_RATIO)),
    );
    expect(dims.visibleHeight / dims.fetchWidth).toBeCloseTo(
      WEATHER_STATIC_MAP_VISIBLE_HEIGHT / WEATHER_STATIC_MAP_WIDTH,
      1,
    );
  });

  it("clamps to Yandex static map size limits", () => {
    const narrow = resolveWeatherStaticMapDimensions(80);
    expect(narrow.fetchWidth).toBeGreaterThanOrEqual(160);
    const wide = resolveWeatherStaticMapDimensions(900);
    expect(wide.fetchWidth).toBeLessThanOrEqual(WEATHER_STATIC_MAP_MAX_WIDTH);
    expect(wide.fetchHeight).toBeLessThanOrEqual(WEATHER_STATIC_MAP_MAX_HEIGHT);
  });
});
