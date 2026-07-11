import { WEATHER_STATIC_MAP_DEFAULT_ZOOM } from "./weather-static-map-url";

/** Pan/zoom camera for the Weather location map on one monitor. */
export interface IWeatherMapView {
  centerLat: number;
  centerLon: number;
  zoom: number;
  /** HUD geo when this view was saved; ignored after the shared pin moves. */
  anchorLat: number;
  anchorLon: number;
}

/** Per-monitor map cameras; keyed by {@link getHudDisplayLayoutKey}. Local-only. */
export type TWeatherMapViewByDisplay = Record<string, IWeatherMapView>;

const WEATHER_MAP_ZOOM_MIN = 1;
const WEATHER_MAP_ZOOM_MAX = 17;
/** Shared pin must match within this epsilon for a saved camera to apply. */
const WEATHER_MAP_ANCHOR_EPSILON = 1e-5;

export function defaultWeatherMapView(anchorLat: number, anchorLon: number): IWeatherMapView {
  return {
    centerLat: anchorLat,
    centerLon: anchorLon,
    zoom: WEATHER_STATIC_MAP_DEFAULT_ZOOM,
    anchorLat,
    anchorLon,
  };
}

function clampWeatherMapZoom(zoom: number): number {
  return Math.min(WEATHER_MAP_ZOOM_MAX, Math.max(WEATHER_MAP_ZOOM_MIN, Math.round(zoom)));
}

function weatherMapAnchorsMatch(
  leftLat: number,
  leftLon: number,
  rightLat: number,
  rightLon: number,
): boolean {
  return (
    Math.abs(leftLat - rightLat) <= WEATHER_MAP_ANCHOR_EPSILON &&
    Math.abs(leftLon - rightLon) <= WEATHER_MAP_ANCHOR_EPSILON
  );
}

export function coerceWeatherMapView(raw: unknown): IWeatherMapView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const centerLat = row.centerLat;
  const centerLon = row.centerLon;
  const zoom = row.zoom;
  const anchorLat = row.anchorLat;
  const anchorLon = row.anchorLon;
  if (
    typeof centerLat !== "number" ||
    !Number.isFinite(centerLat) ||
    typeof centerLon !== "number" ||
    !Number.isFinite(centerLon) ||
    typeof zoom !== "number" ||
    !Number.isFinite(zoom) ||
    typeof anchorLat !== "number" ||
    !Number.isFinite(anchorLat) ||
    typeof anchorLon !== "number" ||
    !Number.isFinite(anchorLon)
  ) {
    return null;
  }
  return {
    centerLat,
    centerLon,
    zoom: clampWeatherMapZoom(zoom),
    anchorLat,
    anchorLon,
  };
}

export function coerceWeatherMapViewByDisplay(raw: unknown): TWeatherMapViewByDisplay {
  if (!raw || typeof raw !== "object") return {};
  const out: TWeatherMapViewByDisplay = {};
  for (const [displayKey, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof displayKey !== "string") continue;
    const view = coerceWeatherMapView(value);
    if (view) out[displayKey] = view;
  }
  return out;
}

/** Restores a saved camera when it still matches the shared HUD pin; otherwise the pin + default zoom. */
export function resolveWeatherMapViewForDisplay(
  byDisplay: TWeatherMapViewByDisplay | undefined,
  displayKey: string,
  anchorLat: number,
  anchorLon: number,
): IWeatherMapView {
  const saved = byDisplay?.[displayKey];
  if (saved && weatherMapAnchorsMatch(saved.anchorLat, saved.anchorLon, anchorLat, anchorLon)) {
    return {
      centerLat: saved.centerLat,
      centerLon: saved.centerLon,
      zoom: clampWeatherMapZoom(saved.zoom),
      anchorLat,
      anchorLon,
    };
  }
  return defaultWeatherMapView(anchorLat, anchorLon);
}

export function patchWeatherMapViewForDisplay(
  byDisplay: TWeatherMapViewByDisplay | undefined,
  displayKey: string,
  view: IWeatherMapView,
): TWeatherMapViewByDisplay {
  return {
    ...(byDisplay ?? {}),
    [displayKey]: {
      centerLat: view.centerLat,
      centerLon: view.centerLon,
      zoom: clampWeatherMapZoom(view.zoom),
      anchorLat: view.anchorLat,
      anchorLon: view.anchorLon,
    },
  };
}

export function resetWeatherMapViewForDisplay(
  byDisplay: TWeatherMapViewByDisplay | undefined,
  displayKey: string,
): TWeatherMapViewByDisplay {
  if (!byDisplay || !(displayKey in byDisplay)) return byDisplay ?? {};
  const next = { ...byDisplay };
  delete next[displayKey];
  return next;
}
