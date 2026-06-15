/** Weather panel location map (Yandex hybrid) — sized to panel width; overflow clips footer branding. */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  WEATHER_STATIC_MAP_VISIBLE_HEIGHT,
  WEATHER_STATIC_MAP_WIDTH,
  buildWeatherStaticMapUrl,
  resolveWeatherStaticMapDimensions,
  type TWeatherStaticMapDimensions,
} from "../../lib/weather/weather-static-map-url";
import {
  WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS,
  isWeatherStaticMapImageDisplayed,
  resolveWeatherStaticMapMeasureWidth,
  weatherStaticMapRetryDelayMs,
} from "../../lib/weather/weather-static-map-measure";

export function WeatherStaticMap({
  lat,
  lon,
  zoom = WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  className = "",
}: {
  lat: number;
  lon: number;
  zoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dimensions, setDimensions] = useState<TWeatherStaticMapDimensions | null>(() =>
    resolveWeatherStaticMapDimensions(resolveWeatherStaticMapMeasureWidth(0)),
  );
  const [loaded, setLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const markLoadedIfReady = useCallback((img: HTMLImageElement | null): void => {
    if (img && isWeatherStaticMapImageDisplayed(img)) {
      setLoaded(true);
    }
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = (): void => {
      const next = resolveWeatherStaticMapDimensions(
        resolveWeatherStaticMapMeasureWidth(el.clientWidth),
      );
      setDimensions((prev) => {
        if (
          prev &&
          prev.fetchWidth === next.fetchWidth &&
          prev.fetchHeight === next.fetchHeight &&
          prev.visibleHeight === next.visibleHeight
        ) {
          return prev;
        }
        return next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  const src = useMemo(() => {
    if (!dimensions) return null;
    return buildWeatherStaticMapUrl(lat, lon, zoom, dimensions);
  }, [dimensions, lat, lon, zoom]);

  useEffect(() => {
    setLoaded(false);
    setLoadAttempt(0);
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    markLoadedIfReady(imgRef.current);
  }, [markLoadedIfReady, src]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current != null) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const handleImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      markLoadedIfReady(node);
    },
    [markLoadedIfReady],
  );

  const handleImageError = useCallback(() => {
    setLoaded(false);
    if (loadAttempt + 1 >= WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS) {
      return;
    }
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
    }
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setLoadAttempt((attempt) => attempt + 1);
    }, weatherStaticMapRetryDelayMs(loadAttempt));
  }, [loadAttempt]);

  return (
    <div
      ref={containerRef}
      className={`weather-location-map ${className}`.trim()}
      style={
        dimensions
          ? { height: dimensions.visibleHeight }
          : {
              aspectRatio: `${WEATHER_STATIC_MAP_WIDTH} / ${WEATHER_STATIC_MAP_VISIBLE_HEIGHT}`,
            }
      }
      aria-label="Map showing your saved weather location"
    >
      {src ? (
        <img
          key={`${src}-${loadAttempt}`}
          ref={handleImageRef}
          src={src}
          alt=""
          className={loaded ? "weather-location-map-img is-loaded" : "weather-location-map-img"}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={handleImageError}
        />
      ) : null}
    </div>
  );
}
