import {
  resolveWeatherStaticMapDimensions,
  WEATHER_STATIC_MAP_WIDTH,
  type TWeatherStaticMapDimensions,
} from "./weather-static-map-url";

/** Use panel width when laid out; otherwise default fetch width (e2e / pre-layout callers only). */
export function resolveWeatherStaticMapMeasureWidth(containerWidthPx: number): number {
  return containerWidthPx > 0 ? containerWidthPx : WEATHER_STATIC_MAP_WIDTH;
}

export type TWeatherStaticMapLayout = {
  containerWidthPx: number;
  /** {@link getHudDisplayLayoutKey} for the screen hosting the new tab — bumps on monitor moves. */
  displayKey: string;
  dimensions: TWeatherStaticMapDimensions;
};

/** Measured panel width plus matching Yandex fetch size; null until the container has a real width. */
export function resolveWeatherStaticMapLayout(
  containerWidthPx: number,
  displayKey: string,
): TWeatherStaticMapLayout | null {
  if (containerWidthPx <= 0) {
    return null;
  }
  return {
    containerWidthPx,
    displayKey,
    dimensions: resolveWeatherStaticMapDimensions(containerWidthPx),
  };
}

export function areWeatherStaticMapLayoutsEqual(
  left: TWeatherStaticMapLayout | null,
  right: TWeatherStaticMapLayout | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.containerWidthPx === right.containerWidthPx &&
    left.displayKey === right.displayKey &&
    left.dimensions.fetchWidth === right.dimensions.fetchWidth &&
    left.dimensions.fetchHeight === right.dimensions.fetchHeight &&
    left.dimensions.visibleHeight === right.dimensions.visibleHeight
  );
}

/** Guard against showing a tile fetched for one width inside a panel resized on another monitor. */
export function isWeatherStaticMapImageDimensionallySynced(
  layout: TWeatherStaticMapLayout,
  img: HTMLImageElement | null,
): boolean {
  if (!img || !isWeatherStaticMapImageDisplayed(img)) {
    return false;
  }
  return img.naturalWidth === layout.dimensions.fetchWidth;
}

/** Defer measurement until after monitor-move reflow (matches HUD auto-repack timing). */
export function scheduleWeatherStaticMapRecalibration(measure: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(measure);
  });
}

/** Window / viewport hooks that can change panel width or active display after a monitor move. */
export function attachWeatherStaticMapRecalibrationListeners(
  onRecalibrate: () => void,
): () => void {
  const schedule = (): void => {
    scheduleWeatherStaticMapRecalibration(onRecalibrate);
  };

  window.addEventListener("resize", schedule);
  window.addEventListener("focus", schedule);
  const visualViewport = window.visualViewport;
  visualViewport?.addEventListener("resize", schedule);
  visualViewport?.addEventListener("scroll", schedule);

  return () => {
    window.removeEventListener("resize", schedule);
    window.removeEventListener("focus", schedule);
    visualViewport?.removeEventListener("resize", schedule);
    visualViewport?.removeEventListener("scroll", schedule);
  };
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
