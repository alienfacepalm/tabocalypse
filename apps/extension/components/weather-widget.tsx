import React, { useEffect, useState } from "react";
import { fetchOpenMeteo, type WeatherSnapshot } from "../lib/weather/fetch-weather";

export function WeatherWidget({ lat, lon }: { lat: number; lon: number }) {
  const [w, setW] = useState<WeatherSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    fetchOpenMeteo(lat, lon)
      .then((snap) => {
        if (!cancelled) setW(snap);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Weather failed");
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return (
    <section className="card">
      <h3>Weather</h3>
      <p className="muted" style={{ fontSize: 12 }}>
        Open-Meteo (no key). Coords: {lat.toFixed(2)}, {lon.toFixed(2)}
      </p>
      {err ? <p className="err">{err}</p> : null}
      {w ? (
        <p className="weather-big">
          {w.temperatureC.toFixed(1)}°C · {w.summary}
        </p>
      ) : !err ? (
        <p className="muted">Loading…</p>
      ) : null}
    </section>
  );
}
