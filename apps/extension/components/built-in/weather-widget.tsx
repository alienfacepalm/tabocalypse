/**
 * Built-in HUD weather panel. Open-Meteo fetch + unit types live under `lib/weather/`.
 * Declarative plugin panels are rendered separately in `components/plugin-views.tsx`.
 */
import React, { useCallback, useEffect, useState } from "react";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import { PrivilegedFetchErrorPanel } from "../privileged-fetch-error-panel";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { formatWeatherDayLabel } from "../../lib/weather/format-weather-day-label";
import {
  fetchOpenMeteo,
  type IWeatherDayForecast,
  type IWeatherForecast,
} from "../../lib/weather/fetch-weather";
import { WeatherConditionIcon } from "../../lib/weather/weather-condition-icon";
import { LakesBuoyPanel } from "./lakes-buoy-panel";
import { WeatherStaticMap } from "./weather-static-map";
import {
  resolveWeatherPanelView,
  type TWeatherPanelView,
} from "../../lib/weather/weather-panel-view";
import {
  WEATHER_TEN_DAY_LAYOUT_LABELS,
  WEATHER_TEN_DAY_LAYOUTS,
  type TWeatherTenDayLayout,
} from "../../lib/weather/weather-ten-day-layout";
import {
  WEATHER_TEMPERATURE_UNITS,
  WEATHER_UNIT_LABELS,
  type TWeatherTemperatureUnit,
} from "../../lib/weather/weather-units";

function formatHighLowRange(
  day: IWeatherDayForecast,
  unit: TWeatherTemperatureUnit,
  locale: string,
): string {
  return `${formatTemperatureValue(day.high, unit, locale)} / ${formatTemperatureValue(day.low, unit, locale)}`;
}

function WeatherTenDayRow({
  day,
  temperatureUnit,
  displayLocale,
  layout,
}: {
  day: IWeatherDayForecast;
  temperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  layout: TWeatherTenDayLayout;
}) {
  const dayLabel = formatWeatherDayLabel(day.date, displayLocale);
  const temps = formatHighLowRange(day, temperatureUnit, displayLocale);
  const ariaLabel = `${dayLabel}, high ${formatTemperatureValue(day.high, temperatureUnit, displayLocale)}, low ${formatTemperatureValue(day.low, temperatureUnit, displayLocale)}, ${day.summary}`;

  if (layout === "stack") {
    return (
      <div className="weather-ten-day-item weather-ten-day-item--stack" aria-label={ariaLabel}>
        <div className="weather-ten-day-stack-main">
          <WeatherConditionIcon code={day.code} size={28} />
          <div className="min-w-0">
            <p className="weather-ten-day-day">{dayLabel}</p>
            <p className="weather-ten-day-summary">{day.summary}</p>
          </div>
        </div>
        <p className="weather-ten-day-temps">{temps}</p>
      </div>
    );
  }

  return (
    <div className="weather-ten-day-item weather-ten-day-item--row" aria-label={ariaLabel}>
      <p className="weather-ten-day-day">{dayLabel}</p>
      <WeatherConditionIcon code={day.code} size={24} />
      <p className="weather-ten-day-temps">{temps}</p>
    </div>
  );
}

export function WeatherWidget({
  lat,
  lon,
  showGeoAccuracyHint,
  onOpenWeatherSettings,
  effectiveTemperatureUnit,
  displayLocale,
  lakesEmbedEnabled,
  panelView,
  tenDayLayout,
  onSelectPanelView,
  onSelectTenDayLayout,
  onSelectExplicitTemperatureUnit,
}: {
  lat: number;
  lon: number;
  showGeoAccuracyHint: boolean;
  onOpenWeatherSettings: () => void;
  effectiveTemperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  /** When true, adds a Forecast / 2 Lakes switch with King County buoy data (Settings → Weather). */
  lakesEmbedEnabled: boolean;
  panelView: TWeatherPanelView;
  tenDayLayout: TWeatherTenDayLayout;
  onSelectPanelView: (next: TWeatherPanelView) => void;
  onSelectTenDayLayout: (next: TWeatherTenDayLayout) => void;
  onSelectExplicitTemperatureUnit: (next: TWeatherTemperatureUnit) => void;
}) {
  const [forecast, setForecast] = useState<IWeatherForecast | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const activePanelView = resolveWeatherPanelView(panelView, lakesEmbedEnabled);

  const loadForecast = useCallback(() => {
    let cancelled = false;
    setErr(null);
    setForecast(null);

    void fetchOpenMeteo(lat, lon, effectiveTemperatureUnit)
      .then((snap) => {
        if (!cancelled) setForecast(snap);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Weather failed");
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon, effectiveTemperatureUnit]);

  useEffect(() => loadForecast(), [loadForecast, reloadToken]);

  const retryForecast = (): void => {
    setReloadToken((n) => n + 1);
  };

  const current = forecast?.current ?? null;

  return (
    <section className="card flex flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <HudPanelTitleInline>Weather</HudPanelTitleInline>
          {activePanelView === "forecast" ||
          activePanelView === "tenDay" ||
          activePanelView === "lakes" ? (
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="row wrap gap-1" role="group" aria-label="Weather panel view">
            <HudTip tip="Show current conditions for your saved coordinates">
              <button
                type="button"
                className={activePanelView === "forecast" ? "btn primary sm" : "btn sm"}
                onClick={() => onSelectPanelView("forecast")}
              >
                Forecast
              </button>
            </HudTip>
            <HudTip tip="Show a 10-day high/low outlook from Open-Meteo">
              <button
                type="button"
                className={activePanelView === "tenDay" ? "btn primary sm" : "btn sm"}
                onClick={() => onSelectPanelView("tenDay")}
              >
                10 Day
              </button>
            </HudTip>
            {lakesEmbedEnabled ? (
              <HudTip tip="Show Lake Sammamish and Lake Washington buoy readings">
                <button
                  type="button"
                  className={activePanelView === "lakes" ? "btn primary sm" : "btn sm"}
                  onClick={() => onSelectPanelView("lakes")}
                >
                  2 Lakes
                </button>
              </HudTip>
            ) : null}
          </div>
          {activePanelView === "tenDay" ? (
            <div className="row wrap gap-1" role="group" aria-label="10-day forecast layout">
              {WEATHER_TEN_DAY_LAYOUTS.map((layout) => (
                <HudTip
                  key={layout}
                  tip={
                    layout === "row"
                      ? "Show days in a horizontal row"
                      : "Stack days vertically in a list"
                  }
                >
                  <button
                    type="button"
                    className={tenDayLayout === layout ? "btn primary sm" : "btn sm"}
                    onClick={() => onSelectTenDayLayout(layout)}
                  >
                    {WEATHER_TEN_DAY_LAYOUT_LABELS[layout]}
                  </button>
                </HudTip>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <HudPanelBody>
        {activePanelView === "lakes" ? (
          <LakesBuoyPanel
            temperatureUnit={effectiveTemperatureUnit}
            displayLocale={displayLocale}
          />
        ) : activePanelView === "tenDay" ? (
          <>
            {err ? (
              <PrivilegedFetchErrorPanel
                message={err}
                onRetry={retryForecast}
                retryTip="Try fetching the Open-Meteo forecast again"
                retryAriaLabel="Retry weather forecast"
              />
            ) : null}
            {forecast ? (
              <div
                className={
                  tenDayLayout === "stack" ? "weather-ten-day-stack" : "weather-ten-day-row"
                }
                aria-label="10-day forecast"
              >
                {forecast.daily.map((day) => (
                  <WeatherTenDayRow
                    key={day.date}
                    day={day}
                    temperatureUnit={effectiveTemperatureUnit}
                    displayLocale={displayLocale}
                    layout={tenDayLayout}
                  />
                ))}
              </div>
            ) : !err ? (
              <p className="muted">Loading…</p>
            ) : null}
          </>
        ) : (
          <>
            {err ? (
              <PrivilegedFetchErrorPanel
                message={err}
                onRetry={retryForecast}
                retryTip="Try fetching the Open-Meteo forecast again"
                retryAriaLabel="Retry weather forecast"
              />
            ) : null}
            {current ? (
              <div
                className="weather-forecast-hero"
                aria-label={`${formatTemperatureValue(current.temperature, current.temperatureUnit, displayLocale)}, ${current.summary}`}
              >
                <WeatherConditionIcon code={current.code} />
                <div className="min-w-0">
                  <p className="weather-temp">
                    {formatTemperatureValue(
                      current.temperature,
                      current.temperatureUnit,
                      displayLocale,
                    )}
                  </p>
                  <p className="weather-condition-label">
                    <span>{current.summary}</span>
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
