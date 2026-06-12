/** Weather panel location map (Yandex hybrid) — sized to panel width; overflow clips footer branding. */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  WEATHER_STATIC_MAP_VISIBLE_HEIGHT,
  WEATHER_STATIC_MAP_WIDTH,
  buildWeatherStaticMapUrl,
  resolveWeatherStaticMapDimensions,
  type TWeatherStaticMapDimensions,
} from "../../lib/weather/weather-static-map-url";

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
  const [dimensions, setDimensions] = useState<TWeatherStaticMapDimensions | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = (): void => {
      if (el.clientWidth <= 0) return;
      const next = resolveWeatherStaticMapDimensions(el.clientWidth);
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
  }, [src]);

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
          key={src}
          src={src}
          alt=""
          className={loaded ? "weather-location-map-img is-loaded" : "weather-location-map-img"}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </div>
  );
}
