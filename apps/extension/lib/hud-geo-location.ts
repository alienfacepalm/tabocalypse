/** Shared HUD coordinates persisted on settings (storage keys keep the `weather*` prefix). */
export interface IHudGeoLocation {
  lat: number;
  lon: number;
  geoAdjusted: boolean;
  autoGeo: boolean;
}

export interface IHudGeoSettingsSlice {
  weatherLat: number;
  weatherLon: number;
  weatherGeoAdjusted: boolean;
  weatherAutoGeo: boolean;
}

export const DEFAULT_HUD_GEO_LAT = 40.7128;
export const DEFAULT_HUD_GEO_LON = -74.006;

/** Read the single HUD geo slice every geo-based panel must use (Weather, Clock, Balanced News, …). */
export function resolveHudGeoLocation(settings: IHudGeoSettingsSlice): IHudGeoLocation {
  return {
    lat: settings.weatherLat,
    lon: settings.weatherLon,
    geoAdjusted: settings.weatherGeoAdjusted,
    autoGeo: settings.weatherAutoGeo,
  };
}

/** Apply browser or manual lookup coordinates to persisted settings. */
export function patchHudGeoCoords(
  latitude: number,
  longitude: number,
): Pick<IHudGeoSettingsSlice, "weatherLat" | "weatherLon" | "weatherGeoAdjusted"> {
  return {
    weatherLat: latitude,
    weatherLon: longitude,
    weatherGeoAdjusted: true,
  };
}

/** Mark manual coordinate edits on the shared HUD geo slice. */
export function patchHudGeoManualCoord(
  field: "lat" | "lon",
  value: number,
): Partial<Pick<IHudGeoSettingsSlice, "weatherLat" | "weatherLon">> &
  Pick<IHudGeoSettingsSlice, "weatherGeoAdjusted"> {
  return field === "lat"
    ? { weatherLat: value, weatherGeoAdjusted: true }
    : { weatherLon: value, weatherGeoAdjusted: true };
}
