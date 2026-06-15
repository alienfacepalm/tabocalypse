import { WEATHER_STATIC_MAP_WIDTH } from "./weather-static-map-url";

/** Use panel width when laid out; otherwise default fetch width so the map still loads on first paint. */
export function resolveWeatherStaticMapMeasureWidth(containerWidthPx: number): number {
  return containerWidthPx > 0 ? containerWidthPx : WEATHER_STATIC_MAP_WIDTH;
}

/** True when the browser has a decoded map tile ready to show (cache-complete before onLoad). */
export function isWeatherStaticMapImageDisplayed(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/** Backoff delay before retrying a failed static map image load. */
export function weatherStaticMapRetryDelayMs(attemptIndex: number): number {
  return 400 * (attemptIndex + 1);
}

export const WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS = 4;
