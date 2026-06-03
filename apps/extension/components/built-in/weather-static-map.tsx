/**
 * Weather panel location map — same Yandex static map pattern as
 * `../2lakes.app/src/components/StaticMap.tsx` (115% crop hides footer branding).
 */
import React, { useMemo, useState } from "react";
import { buildWeatherStaticMapUrl } from "../../lib/weather/weather-static-map-url";

export function WeatherStaticMap({
  lat,
  lon,
  zoom = 11,
  className = "",
}: {
  lat: number;
  lon: number;
  zoom?: number;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = useMemo(() => buildWeatherStaticMapUrl(lat, lon, zoom), [lat, lon, zoom]);

  return (
    <div
      className={`weather-location-map ${className}`.trim()}
      aria-label="Map showing your saved weather location"
    >
      <div className="weather-location-map-crop">
        <img
          src={src}
          alt=""
          className={loaded ? "weather-location-map-img is-loaded" : "weather-location-map-img"}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
