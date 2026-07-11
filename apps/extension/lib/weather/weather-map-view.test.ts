import { describe, expect, it } from "vitest";
import { WEATHER_STATIC_MAP_DEFAULT_ZOOM } from "./weather-static-map-url";
import {
  coerceWeatherMapView,
  coerceWeatherMapViewByDisplay,
  defaultWeatherMapView,
  patchWeatherMapViewForDisplay,
  resetWeatherMapViewForDisplay,
  resolveWeatherMapViewForDisplay,
} from "./weather-map-view";

describe("weather map view by display", () => {
  const displayA = "0,0,1920,1080";
  const displayB = "1920,0,2560,1440";
  const anchorLat = 40.7128;
  const anchorLon = -74.006;

  it("defaultWeatherMapView centers on the shared pin at default zoom", () => {
    expect(defaultWeatherMapView(anchorLat, anchorLon)).toEqual({
      centerLat: anchorLat,
      centerLon: anchorLon,
      zoom: WEATHER_STATIC_MAP_DEFAULT_ZOOM,
      anchorLat,
      anchorLon,
    });
  });

  it("resolveWeatherMapViewForDisplay falls back when no override", () => {
    expect(resolveWeatherMapViewForDisplay({}, displayA, anchorLat, anchorLon)).toEqual(
      defaultWeatherMapView(anchorLat, anchorLon),
    );
    expect(resolveWeatherMapViewForDisplay(undefined, displayA, anchorLat, anchorLon)).toEqual(
      defaultWeatherMapView(anchorLat, anchorLon),
    );
  });

  it("resolveWeatherMapViewForDisplay restores a matching saved camera", () => {
    const byDisplay = {
      [displayB]: {
        centerLat: 40.75,
        centerLon: -73.98,
        zoom: 12,
        anchorLat,
        anchorLon,
      },
    };
    expect(resolveWeatherMapViewForDisplay(byDisplay, displayB, anchorLat, anchorLon)).toEqual({
      centerLat: 40.75,
      centerLon: -73.98,
      zoom: 12,
      anchorLat,
      anchorLon,
    });
    expect(resolveWeatherMapViewForDisplay(byDisplay, displayA, anchorLat, anchorLon)).toEqual(
      defaultWeatherMapView(anchorLat, anchorLon),
    );
  });

  it("resolveWeatherMapViewForDisplay ignores a camera after the shared pin moves", () => {
    const byDisplay = {
      [displayA]: {
        centerLat: 40.75,
        centerLon: -73.98,
        zoom: 11,
        anchorLat,
        anchorLon,
      },
    };
    expect(resolveWeatherMapViewForDisplay(byDisplay, displayA, 34.0522, -118.2437)).toEqual(
      defaultWeatherMapView(34.0522, -118.2437),
    );
  });

  it("patchWeatherMapViewForDisplay layers updates without clobbering other monitors", () => {
    const patched = patchWeatherMapViewForDisplay(
      {
        [displayA]: {
          centerLat: 1,
          centerLon: 2,
          zoom: 10,
          anchorLat,
          anchorLon,
        },
      },
      displayB,
      {
        centerLat: 3,
        centerLon: 4,
        zoom: 9,
        anchorLat,
        anchorLon,
      },
    );
    expect(patched[displayA]?.zoom).toBe(10);
    expect(patched[displayB]?.centerLat).toBe(3);
    expect(patched[displayB]?.zoom).toBe(9);
  });

  it("resetWeatherMapViewForDisplay removes one monitor only", () => {
    const byDisplay = {
      [displayA]: defaultWeatherMapView(anchorLat, anchorLon),
      [displayB]: {
        centerLat: 40.75,
        centerLon: -73.98,
        zoom: 12,
        anchorLat,
        anchorLon,
      },
    };
    const next = resetWeatherMapViewForDisplay(byDisplay, displayA);
    expect(next[displayA]).toBeUndefined();
    expect(next[displayB]?.zoom).toBe(12);
  });

  it("coerceWeatherMapViewByDisplay drops invalid rows", () => {
    expect(
      coerceWeatherMapViewByDisplay({
        [displayA]: {
          centerLat: 40.75,
          centerLon: -73.98,
          zoom: 12,
          anchorLat,
          anchorLon,
        },
        bad: "nope",
        [displayB]: { centerLat: "x" },
      }),
    ).toEqual({
      [displayA]: {
        centerLat: 40.75,
        centerLon: -73.98,
        zoom: 12,
        anchorLat,
        anchorLon,
      },
    });
  });

  it("coerceWeatherMapView clamps zoom", () => {
    expect(
      coerceWeatherMapView({
        centerLat: 1,
        centerLon: 2,
        zoom: 99,
        anchorLat: 1,
        anchorLon: 2,
      })?.zoom,
    ).toBe(17);
    expect(
      coerceWeatherMapView({
        centerLat: 1,
        centerLon: 2,
        zoom: 0,
        anchorLat: 1,
        anchorLon: 2,
      })?.zoom,
    ).toBe(1);
  });
});
