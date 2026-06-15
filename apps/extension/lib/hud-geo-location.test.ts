import { describe, expect, it } from "vitest";
import {
  patchHudGeoCoords,
  patchHudGeoManualCoord,
  resolveHudGeoLocation,
  type IHudGeoSettingsSlice,
} from "./hud-geo-location";

const baseGeo: IHudGeoSettingsSlice = {
  weatherLat: 40.7128,
  weatherLon: -74.006,
  weatherGeoAdjusted: false,
  weatherAutoGeo: false,
};

describe("resolveHudGeoLocation", () => {
  it("reads the shared HUD geo slice from settings", () => {
    const settings: IHudGeoSettingsSlice = {
      ...baseGeo,
      weatherLat: 51.5,
      weatherLon: -0.12,
      weatherGeoAdjusted: true,
      weatherAutoGeo: true,
    };
    expect(resolveHudGeoLocation(settings)).toEqual({
      lat: 51.5,
      lon: -0.12,
      geoAdjusted: true,
      autoGeo: true,
    });
  });
});

describe("patchHudGeoCoords", () => {
  it("marks coordinates as user-adjusted", () => {
    expect(patchHudGeoCoords(10, 20)).toEqual({
      weatherLat: 10,
      weatherLon: 20,
      weatherGeoAdjusted: true,
    });
  });
});

describe("patchHudGeoManualCoord", () => {
  it("updates latitude and marks geo adjusted", () => {
    expect(patchHudGeoManualCoord("lat", 33)).toEqual({
      weatherLat: 33,
      weatherGeoAdjusted: true,
    });
  });

  it("updates longitude and marks geo adjusted", () => {
    expect(patchHudGeoManualCoord("lon", -122)).toEqual({
      weatherLon: -122,
      weatherGeoAdjusted: true,
    });
  });
});
