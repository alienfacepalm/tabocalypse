/**
 * Built-in HUD weather panel. Open-Meteo fetch + unit types live under `lib/weather/`.
 * Declarative plugin panels are rendered separately in `components/plugin-views.tsx`.
 */
import { ExternalLink } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { fetchOpenMeteo, type IWeatherSnapshot } from "../../lib/weather/fetch-weather";
import {
  WEATHER_TEMPERATURE_UNITS,
  WEATHER_UNIT_LABELS,
  type TWeatherTemperatureUnit,
} from "../../lib/weather/weather-units";

/** HTTPS origin embedded when the optional 2 Lakes view is enabled (Settings → Weather). */
export const LAKES_APP_EMBED_URL = "https://2lakes.app/";

type TWeatherPanelView = "forecast" | "lakes";

export function WeatherWidget({
  lat,
  lon,
  effectiveTemperatureUnit,
  displayLocale,
  lakesEmbedEnabled,
  onSelectExplicitTemperatureUnit,
}: {
  lat: number;
  lon: number;
  effectiveTemperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  /** When true, adds a Forecast / 2 Lakes switch and optional iframe (Settings → Weather). */
  lakesEmbedEnabled: boolean;
  onSelectExplicitTemperatureUnit: (next: TWeatherTemperatureUnit) => void;
}) {
  const [w, setW] = useState<IWeatherSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<TWeatherPanelView>("forecast");

  const coordFmt = useMemo(
    () =>
      new Intl.NumberFormat(displayLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [displayLocale],
  );

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

  useEffect(() => {
    if (!lakesEmbedEnabled) {
      setPanelView("forecast");
    }
  }, [lakesEmbedEnabled]);

  return (
    <section className="card">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <HudPanelTitleInline>Weather</HudPanelTitleInline>
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
        </div>
        <p className="muted mt-1 text-xs leading-tight">
          Open-Meteo (no key). Coords: {coordFmt.format(lat)}, {coordFmt.format(lon)}
        </p>
        {lakesEmbedEnabled ? (
          <div className="row wrap gap-1 mt-1" role="group" aria-label="Weather panel view">
            <HudTip tip="Show the Open-Meteo forecast for your saved coordinates">
              <button
                type="button"
                className={panelView === "forecast" ? "btn primary sm" : "btn sm"}
                onClick={() => setPanelView("forecast")}
              >
                Forecast
              </button>
            </HudTip>
            <HudTip tip="Show 2lakes.app inside this panel">
              <button
                type="button"
                className={panelView === "lakes" ? "btn primary sm" : "btn sm"}
                onClick={() => setPanelView("lakes")}
              >
                2 Lakes
              </button>
            </HudTip>
          </div>
        ) : null}
      </div>
      <HudPanelBody bodyOverflow={panelView === "lakes" && lakesEmbedEnabled ? false : undefined}>
        {panelView === "lakes" && lakesEmbedEnabled ? (
          <div className="flex min-h-[min(50vh,28rem)] flex-1 flex-col gap-2">
            <div className="row wrap gap-2 shrink-0">
              <HudTip tip="Open 2lakes.app in a new browser tab">
                <a
                  className="btn sm has-icon"
                  href={LAKES_APP_EMBED_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={18} strokeWidth={2} aria-hidden />
                  <span>Open in tab</span>
                </a>
              </HudTip>
            </div>
            <iframe
              title="2lakes.app"
              src={LAKES_APP_EMBED_URL}
              className="min-h-0 w-full flex-1 border border-border bg-input"
            />
          </div>
        ) : (
          <>
            {err ? <p className="err">{err}</p> : null}
            {w ? (
              <p className="weather-big">
                {formatTemperatureValue(w.temperature, w.temperatureUnit, displayLocale)} ·{" "}
                {w.summary}
              </p>
            ) : !err ? (
              <p className="muted">Loading…</p>
            ) : null}
          </>
        )}
      </HudPanelBody>
    </section>
  );
}
