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
  offsetWeatherStaticMapCenter,
  resolveWeatherStaticMapDimensions,
} from "./weather-static-map-url";

describe("buildWeatherStaticMapUrl", () => {
  it("builds a Yandex hybrid static map URL centered on saved coordinates", () => {
    const url = buildWeatherStaticMapUrl(47.6062, -122.3321, 11);
    expect(url).toMatch(/^https:\/\/static-maps\.yandex\.ru\/1\.x\/\?/);
    expect(url).toContain("ll=-122.3321,47.6062");
    expect(url).toContain("z=11");
    expect(url).toContain(`l=${WEATHER_STATIC_MAP_LAYER}`);
    expect(url).not.toContain("pt=");
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

describe("offsetWeatherStaticMapCenter", () => {
  it("moves the center west when the map is dragged right", () => {
    const next = offsetWeatherStaticMapCenter(47.6062, -122.3321, 14, 100, 0);
    expect(next.lon).toBeLessThan(-122.3321);
    expect(next.lat).toBeCloseTo(47.6062, 2);
  });

  it("moves the center north when the map is dragged down", () => {
    const next = offsetWeatherStaticMapCenter(47.6062, -122.3321, 14, 0, 100);
    expect(next.lat).toBeGreaterThan(47.6062);
    expect(next.lon).toBeCloseTo(-122.3321, 2);
  });

  it("round-trips a pixel offset at the same zoom", () => {
    const start = { lat: 40.7128, lon: -74.006 };
    const shifted = offsetWeatherStaticMapCenter(start.lat, start.lon, 12, 48, -32);
    const back = offsetWeatherStaticMapCenter(shifted.lat, shifted.lon, 12, -48, 32);
    expect(back.lat).toBeCloseTo(start.lat, 4);
    expect(back.lon).toBeCloseTo(start.lon, 4);
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
