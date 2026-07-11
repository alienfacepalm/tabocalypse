/** Yandex static map (free, no API key) for the Weather widget location map. */
/** Hybrid satellite + labels; scheme (`map`) often omits smaller US lakes at neighborhood zoom. */
export const WEATHER_STATIC_MAP_LAYER = "sat,skl";
export const WEATHER_STATIC_MAP_WIDTH = 600;
/** Default fetched image height when container size is not measured yet. */
export const WEATHER_STATIC_MAP_HEIGHT = 380;
/** Yandex static map API size limits. */
export const WEATHER_STATIC_MAP_MAX_WIDTH = 650;
export const WEATHER_STATIC_MAP_MAX_HEIGHT = 450;
export const WEATHER_STATIC_MAP_MIN_WIDTH = 160;
/** Bottom branding strip height as a fraction of the fetched image. */
export const WEATHER_STATIC_MAP_BRANDING_CROP_RATIO = 15 / 115;
export const WEATHER_STATIC_MAP_VISIBLE_HEIGHT = Math.round(
  WEATHER_STATIC_MAP_HEIGHT * (1 - WEATHER_STATIC_MAP_BRANDING_CROP_RATIO),
);
/** Visible map height per pixel of width (pin-centered crop, branding excluded). */
export const WEATHER_STATIC_MAP_VISIBLE_HEIGHT_RATIO =
  WEATHER_STATIC_MAP_VISIBLE_HEIGHT / WEATHER_STATIC_MAP_WIDTH;
/** Default zoom — tight neighborhood view around the saved pin. */
export const WEATHER_STATIC_MAP_DEFAULT_ZOOM = 14;

export type TWeatherStaticMapDimensions = {
  fetchWidth: number;
  fetchHeight: number;
  visibleHeight: number;
};

/** Size a map fetch to the panel width so tiles fill the available real estate. */
export function resolveWeatherStaticMapDimensions(
  containerWidthPx: number,
): TWeatherStaticMapDimensions {
  const fetchWidth = Math.min(
    WEATHER_STATIC_MAP_MAX_WIDTH,
    Math.max(WEATHER_STATIC_MAP_MIN_WIDTH, Math.round(containerWidthPx)),
  );
  const targetVisibleHeight = Math.round(fetchWidth * WEATHER_STATIC_MAP_VISIBLE_HEIGHT_RATIO);
  const fetchHeight = Math.min(
    WEATHER_STATIC_MAP_MAX_HEIGHT,
    Math.round(targetVisibleHeight / (1 - WEATHER_STATIC_MAP_BRANDING_CROP_RATIO)),
  );
  const visibleHeight = Math.round(fetchHeight * (1 - WEATHER_STATIC_MAP_BRANDING_CROP_RATIO));
  return { fetchWidth, fetchHeight, visibleHeight };
}

export function buildWeatherStaticMapUrl(
  lat: number,
  lon: number,
  zoom: number,
  dimensions?: Pick<TWeatherStaticMapDimensions, "fetchWidth" | "fetchHeight">,
): string {
  const z = Math.min(17, Math.max(1, Math.round(zoom)));
  const width = dimensions?.fetchWidth ?? WEATHER_STATIC_MAP_WIDTH;
  const height = dimensions?.fetchHeight ?? WEATHER_STATIC_MAP_HEIGHT;
  // Map center (`ll`) marks the saved coordinates; the UI draws its own centered pin overlay.
  return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${z}&l=${WEATHER_STATIC_MAP_LAYER}&size=${width},${height}&lang=en_US`;
}

const WEATHER_STATIC_MAP_TILE_SIZE = 256;

function weatherStaticMapLatLonToWorldPixels(
  lat: number,
  lon: number,
  zoom: number,
): { x: number; y: number } {
  const scale = WEATHER_STATIC_MAP_TILE_SIZE * 2 ** zoom;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function weatherStaticMapWorldPixelsToLatLon(
  x: number,
  y: number,
  zoom: number,
): { lat: number; lon: number } {
  const scale = WEATHER_STATIC_MAP_TILE_SIZE * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lon };
}

function clampWeatherStaticMapLatitude(lat: number): number {
  return Math.min(85, Math.max(-85, lat));
}

function normalizeWeatherStaticMapLongitude(lon: number): number {
  const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}

/** Shift the map center after a pointer drag in screen pixels (Web Mercator at zoom). */
export function offsetWeatherStaticMapCenter(
  centerLat: number,
  centerLon: number,
  zoom: number,
  pixelDx: number,
  pixelDy: number,
): { lat: number; lon: number } {
  const z = Math.min(17, Math.max(1, Math.round(zoom)));
  const centerPx = weatherStaticMapLatLonToWorldPixels(centerLat, centerLon, z);
  const next = weatherStaticMapWorldPixelsToLatLon(centerPx.x - pixelDx, centerPx.y - pixelDy, z);
  return {
    lat: clampWeatherStaticMapLatitude(next.lat),
    lon: normalizeWeatherStaticMapLongitude(next.lon),
  };
}
