/**
 * Built-in HUD weather panel. Open-Meteo fetch + unit types live under `lib/weather/`.
 * Declarative plugin panels are rendered separately in `components/plugin-views.tsx`.
 */
import React, { useEffect, useState } from "react";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { fetchOpenMeteo, type IWeatherSnapshot } from "../../lib/weather/fetch-weather";
import { WeatherConditionIcon } from "../../lib/weather/weather-condition-icon";
import { LakesBuoyPanel } from "./lakes-buoy-panel";
import { WeatherStaticMap } from "./weather-static-map";
import type { TWeatherPanelView } from "../../lib/weather/weather-panel-view";
import {
  WEATHER_TEMPERATURE_UNITS,
  WEATHER_UNIT_LABELS,
  type TWeatherTemperatureUnit,
} from "../../lib/weather/weather-units";

export function WeatherWidget({
  lat,
  lon,
  showGeoAccuracyHint,
  onOpenWeatherSettings,
  effectiveTemperatureUnit,
  displayLocale,
  lakesEmbedEnabled,
  lakesApiKey,
  panelView,
  onSelectPanelView,
  onSelectExplicitTemperatureUnit,
}: {
  lat: number;
  lon: number;
  showGeoAccuracyHint: boolean;
  onOpenWeatherSettings: () => void;
  effectiveTemperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  /** When true, adds a Forecast / 2 Lakes switch with buoy API data (Settings → Weather). */
  lakesEmbedEnabled: boolean;
  /** User-supplied 2lakes.app Bearer API key (Settings → Weather). */
  lakesApiKey: string;
  panelView: TWeatherPanelView;
  onSelectPanelView: (next: TWeatherPanelView) => void;
  onSelectExplicitTemperatureUnit: (next: TWeatherTemperatureUnit) => void;
}) {
  const [w, setW] = useState<IWeatherSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const activePanelView: TWeatherPanelView =
    lakesEmbedEnabled && panelView === "lakes" ? "lakes" : "forecast";

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    fetchOpenMeteo(lat, lon, effectiveTemperatureUnit)
      .then((snap) => {
        if (!cancelled) setW(snap);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Weather failed");
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, effectiveTemperatureUnit]);

  return (
    <section className="card flex flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <HudPanelTitleInline>Weather</HudPanelTitleInline>
          {activePanelView === "forecast" || activePanelView === "lakes" ? (
            <div className="row wrap gap-1" role="group" aria-label="Temperature units">
              {WEATHER_TEMPERATURE_UNITS.map((u) => (
                <HudTip
                  key={u}
                  tip={
                    u === "celsius"
                      ? "Always show forecast and readings in Celsius"
                      : "Always show forecast and readings in Fahrenheit"
                  }
                >
                  <button
                    type="button"
                    className={effectiveTemperatureUnit === u ? "btn primary sm" : "btn sm"}
                    onClick={() => onSelectExplicitTemperatureUnit(u)}
                  >
                    {WEATHER_UNIT_LABELS[u]}
                  </button>
                </HudTip>
              ))}
            </div>
          ) : null}
        </div>
        <WeatherStaticMap lat={lat} lon={lon} />
        {showGeoAccuracyHint ? (
          <p className="mt-2 text-xs leading-tight text-[var(--color-accent2)]">
            Default GEO location still active. Open{" "}
            <HudTip tip="Open Settings and jump to the Weather section">
              <button
                type="button"
                className="linkish p-0 text-xs"
                onClick={onOpenWeatherSettings}
                aria-label="Open Settings and jump to the Weather section"
              >
                Settings &gt; Weather
              </button>
            </HudTip>{" "}
            from the gear button in the top bar, then update the coordinates so the forecast targets
            your actual area.
          </p>
        ) : null}
        {lakesEmbedEnabled ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="row wrap gap-1" role="group" aria-label="Weather panel view">
              <HudTip tip="Show the Open-Meteo forecast for your saved coordinates">
                <button
                  type="button"
                  className={activePanelView === "forecast" ? "btn primary sm" : "btn sm"}
                  onClick={() => onSelectPanelView("forecast")}
                >
                  Forecast
                </button>
              </HudTip>
              <HudTip tip="Show Lake Sammamish and Lake Washington buoy readings">
                <button
                  type="button"
                  className={activePanelView === "lakes" ? "btn primary sm" : "btn sm"}
                  onClick={() => onSelectPanelView("lakes")}
                >
                  2 Lakes
                </button>
              </HudTip>
            </div>
          </div>
        ) : null}
      </div>
      <HudPanelBody>
        {activePanelView === "lakes" ? (
          <LakesBuoyPanel
            temperatureUnit={effectiveTemperatureUnit}
            displayLocale={displayLocale}
            lakesApiKey={lakesApiKey}
            onOpenWeatherSettings={onOpenWeatherSettings}
          />
        ) : (
          <>
            {err ? <p className="err">{err}</p> : null}
            {w ? (
              <div
                className="weather-forecast-hero"
                aria-label={`${formatTemperatureValue(w.temperature, w.temperatureUnit, displayLocale)}, ${w.summary}`}
              >
                <WeatherConditionIcon code={w.code} />
                <div className="min-w-0">
                  <p className="weather-temp">
                    {formatTemperatureValue(w.temperature, w.temperatureUnit, displayLocale)}
                  </p>
                  <p className="weather-condition-label">
                    <span>{w.summary}</span>
                  </p>
                </div>
              </div>
            ) : !err ? (
              <p className="muted">Loading…</p>
            ) : null}
          </>
        )}
      </HudPanelBody>
    </section>
  );
}
