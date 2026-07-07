/** Weather panel location map (Yandex hybrid) — 115% crop hides footer branding; HUD pin overlay marks center. */
import { MapPin } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getHudDisplayLayoutKey } from "../../lib/hud-layout";
import {
  WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  WEATHER_STATIC_MAP_VISIBLE_HEIGHT,
  WEATHER_STATIC_MAP_WIDTH,
  buildWeatherStaticMapUrl,
  type TWeatherStaticMapDimensions,
} from "../../lib/weather/weather-static-map-url";
import {
  WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS,
  areWeatherStaticMapLayoutsEqual,
  attachWeatherStaticMapRecalibrationListeners,
  isWeatherStaticMapImageDimensionallySynced,
  resolveWeatherStaticMapLayout,
  type TWeatherStaticMapLayout,
  weatherStaticMapRetryDelayMs,
} from "../../lib/weather/weather-static-map-measure";

export function WeatherStaticMap({
  lat,
  lon,
  zoom = WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  scrollZoomEnabled = false,
  doubleClickZoomEnabled = false,
  onZoomIn,
  onZoomOut,
  className = "",
}: {
  lat: number;
  lon: number;
  zoom?: number;
  scrollZoomEnabled?: boolean;
  doubleClickZoomEnabled?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayKeyRef = useRef(getHudDisplayLayoutKey());
  const [layout, setLayout] = useState<TWeatherStaticMapLayout | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const dimensions: TWeatherStaticMapDimensions | null = layout?.dimensions ?? null;

  const markLoadedIfReady = useCallback(
    (img: HTMLImageElement | null, activeLayout: TWeatherStaticMapLayout | null): void => {
      if (activeLayout && isWeatherStaticMapImageDimensionallySynced(activeLayout, img)) {
        setLoaded(true);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = (): void => {
      const nextDisplayKey = getHudDisplayLayoutKey();
      const displayChanged = nextDisplayKey !== displayKeyRef.current;
      if (displayChanged) {
        displayKeyRef.current = nextDisplayKey;
        setLoaded(false);
      }

      const next = resolveWeatherStaticMapLayout(el.clientWidth, nextDisplayKey);
      setLayout((prev) => (areWeatherStaticMapLayoutsEqual(prev, next) ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const detachWindowListeners = attachWeatherStaticMapRecalibrationListeners(measure);
    return () => {
      ro.disconnect();
      detachWindowListeners();
    };
  }, []);

  const src = useMemo(() => {
    if (!layout) return null;
    return buildWeatherStaticMapUrl(lat, lon, zoom, layout.dimensions);
  }, [layout, lat, lon, zoom]);

  const imageSynced = layout
    ? isWeatherStaticMapImageDimensionallySynced(layout, imgRef.current)
    : false;

  useEffect(() => {
    setLoadAttempt(0);
    setLoaded(false);
  }, [lat, lon, zoom]);

  useEffect(() => {
    setLoaded(false);
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    markLoadedIfReady(imgRef.current, layout);
  }, [layout, markLoadedIfReady, src]);

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
      markLoadedIfReady(node, layout);
    },
    [layout, markLoadedIfReady],
  );

  const handleImageLoad = useCallback(() => {
    if (layout && isWeatherStaticMapImageDimensionallySynced(layout, imgRef.current)) {
      setLoaded(true);
    }
  }, [layout]);

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

  const showMapImage = loaded && imageSynced;
  const mapImageKey = layout
    ? `${layout.displayKey}-${src ?? "pending"}-${loadAttempt}`
    : "pending";

  const interactive = scrollZoomEnabled || doubleClickZoomEnabled;
  const canZoom = typeof onZoomIn === "function" && typeof onZoomOut === "function";

  return (
    <div
      ref={containerRef}
      className={`weather-location-map ${className}`.trim()}
      onWheel={
        interactive && scrollZoomEnabled && canZoom
          ? (e) => {
              e.preventDefault();
              if (e.deltaY < 0) onZoomIn();
              else if (e.deltaY > 0) onZoomOut();
            }
          : undefined
      }
      onDoubleClick={
        interactive && doubleClickZoomEnabled && canZoom
          ? (e) => {
              e.preventDefault();
              onZoomIn();
            }
          : undefined
      }
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
        <div className="weather-location-map-crop">
          <img
            key={mapImageKey}
            ref={handleImageRef}
            src={src}
            alt=""
            className={
              showMapImage ? "weather-location-map-img is-loaded" : "weather-location-map-img"
            }
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      ) : null}
      <MapPin className="weather-location-map-pin" aria-hidden size={28} strokeWidth={2} />
    </div>
  );
}
