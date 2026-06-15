import { describe, expect, it } from "vitest";
import {
  WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  buildWeatherStaticMapUrl,
  resolveWeatherStaticMapDimensions,
} from "./weather-static-map-url";
import { resolveWeatherStaticMapMeasureWidth } from "./weather-static-map-measure";

describe("weather static map load (e2e)", () => {
  it("fetches a Yandex hybrid map image over the network after a simulated fresh reload", async () => {
    const seattleLat = 47.6062;
    const seattleLon = -122.3321;
    const width = resolveWeatherStaticMapMeasureWidth(0);
    const dims = resolveWeatherStaticMapDimensions(width);
    const url = buildWeatherStaticMapUrl(
      seattleLat,
      seattleLon,
      WEATHER_STATIC_MAP_DEFAULT_ZOOM,
      dims,
    );

    const response = await fetch(url, { credentials: "omit" });
    expect(response.ok).toBe(true);
    const contentType = response.headers.get("content-type") ?? "";
    expect(contentType).toMatch(/image/i);

    const bytes = await response.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(4_000);
    expect(new Uint8Array(bytes)[0]).not.toBe(0);
  }, 20_000);
});
