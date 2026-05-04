/**
 * Built-in HUD weather panel. Open-Meteo fetch + unit types live under `lib/weather/`.
 * Declarative plugin panels are rendered separately in `components/plugin-views.tsx`.
 */
import React, { useEffect, useState } from "react";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { fetchOpenMeteo, type IWeatherSnapshot } from "../../lib/weather/fetch-weather";
import {
  WEATHER_TEMPERATURE_UNITS,
  WEATHER_UNIT_LABELS,
  type TWeatherTemperatureUnit,
} from "../../lib/weather/weather-units";

export function WeatherWidget({
  lat,
  lon,
  temperatureUnit,
  onTemperatureUnitChange,
}: {
  lat: number;
  lon: number;
  temperatureUnit: TWeatherTemperatureUnit;
  onTemperatureUnitChange: (next: TWeatherTemperatureUnit) => void;
}) {
  const [w, setW] = useState<IWeatherSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    fetchOpenMeteo(lat, lon, temperatureUnit)
      .then((snap) => {
        if (!cancelled) setW(snap);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Weather failed");
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, temperatureUnit]);

  return (
    <section className="card">
      <div className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <HudPanelTitleInline>Weather</HudPanelTitleInline>
          <div className="row wrap" role="group" aria-label="Temperature units">
            {WEATHER_TEMPERATURE_UNITS.map((u) => (
              <HudTip
                key={u}
                tip={
                  u === "celsius"
                    ? "Switch forecast and readings to Celsius"
                    : "Switch forecast and readings to Fahrenheit"
                }
              >
                <button
                  type="button"
                  className={temperatureUnit === u ? "btn primary sm" : "btn sm"}
                  onClick={() => onTemperatureUnitChange(u)}
                >
                  {WEATHER_UNIT_LABELS[u]}
                </button>
              </HudTip>
            ))}
          </div>
        </div>
        <p className="muted text-xs">
          Open-Meteo (no key). Coords: {lat.toFixed(2)}, {lon.toFixed(2)}
        </p>
      </div>
      <HudPanelBody>
        {err ? <p className="err">{err}</p> : null}
        {w ? (
          <p className="weather-big">
            {formatTemperatureValue(w.temperature, w.temperatureUnit)} · {w.summary}
          </p>
        ) : !err ? (
          <p className="muted">Loading…</p>
        ) : null}
      </HudPanelBody>
    </section>
  );
}
