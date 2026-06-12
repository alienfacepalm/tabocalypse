/**
 * Built-in HUD weather panel. Open-Meteo fetch + unit types live under `lib/weather/`.
 * Declarative plugin panels are rendered separately in `components/plugin-views.tsx`.
 */
import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  Droplets,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import { PrivilegedFetchErrorPanel } from "../privileged-fetch-error-panel";
import {
  formatPrecipChancePercent,
  formatPrecipSum,
  formatUvIndexMax,
  formatWeatherSunTime,
  formatWindSpeedMax,
} from "../../lib/weather/format-weather-daily-detail";
import { TemperatureHighLowRange, TemperatureValue } from "../temperature-value";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { formatWeatherDayLabel } from "../../lib/weather/format-weather-day-label";
import { formatWeatherDayTooltip } from "../../lib/weather/format-weather-day-tooltip";
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
  resolveWeatherTenDayLayout,
  type TWeatherTenDayLayout,
} from "../../lib/weather/weather-ten-day-layout";
import {
  WEATHER_TEMPERATURE_UNITS,
  WEATHER_UNIT_LABELS,
  type TWeatherTemperatureUnit,
} from "../../lib/weather/weather-units";

type TWeatherTenDayDetailRow = {
  label: string;
  value: React.ReactNode;
  Icon: LucideIcon;
};

function buildWeatherTenDayDetailRows(
  day: IWeatherDayForecast,
  temperatureUnit: TWeatherTemperatureUnit,
  displayLocale: string,
): TWeatherTenDayDetailRow[] {
  const rows: TWeatherTenDayDetailRow[] = [];
  const precipChance = formatPrecipChancePercent(day.precipChancePercent);
  if (precipChance) {
    rows.push({ label: "Precip chance", value: precipChance, Icon: Droplets });
  }
  const precipAmount = formatPrecipSum(day.precipSum, temperatureUnit, displayLocale);
  if (precipAmount) {
    rows.push({ label: "Precip amount", value: precipAmount, Icon: CloudRain });
  }
  const wind = formatWindSpeedMax(
    day.windSpeedMax,
    day.windDirectionDegrees,
    temperatureUnit,
    displayLocale,
  );
  if (wind) rows.push({ label: "Wind", value: wind, Icon: Wind });
  if (day.feelsLikeHigh != null && day.feelsLikeLow != null) {
    rows.push({
      label: "Feels like",
      Icon: Thermometer,
      value: (
        <TemperatureHighLowRange
          high={day.feelsLikeHigh}
          low={day.feelsLikeLow}
          unit={temperatureUnit}
          locale={displayLocale}
        />
      ),
    });
  }
  const uv = formatUvIndexMax(day.uvIndexMax, displayLocale);
  if (uv) rows.push({ label: "UV index", value: uv, Icon: Sun });
  const sunrise = formatWeatherSunTime(day.sunrise, displayLocale);
  if (sunrise) rows.push({ label: "Sunrise", value: sunrise, Icon: Sunrise });
  const sunset = formatWeatherSunTime(day.sunset, displayLocale);
  if (sunset) rows.push({ label: "Sunset", value: sunset, Icon: Sunset });
  return rows;
}

function WeatherTenDayRow({
  day,
  temperatureUnit,
  displayLocale,
  layout,
  isExpanded,
  onToggle,
}: {
  day: IWeatherDayForecast;
  temperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  layout: TWeatherTenDayLayout;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const detailsId = useId();
  const dayLabel = formatWeatherDayLabel(day.date, displayLocale);
  const dayTooltip = formatWeatherDayTooltip(day.date, displayLocale, day.summary);
  const detailRows = buildWeatherTenDayDetailRows(day, temperatureUnit, displayLocale);
  const ariaLabel = `${dayLabel}, high ${formatTemperatureValue(day.high, temperatureUnit, displayLocale)}, low ${formatTemperatureValue(day.low, temperatureUnit, displayLocale)}, ${day.summary}`;
  const toggleTip = isExpanded ? "Hide day details" : "Show day details";

  const chevron = isExpanded ? (
    <ChevronUp size={16} strokeWidth={2} aria-hidden />
  ) : (
    <ChevronDown size={16} strokeWidth={2} aria-hidden />
  );

  if (layout === "stack") {
    return (
      <div
        className={
          isExpanded
            ? "weather-ten-day-item weather-ten-day-item--stack weather-ten-day-item--expanded"
            : "weather-ten-day-item weather-ten-day-item--stack"
        }
      >
        <button
          type="button"
          className="weather-ten-day-trigger weather-ten-day-trigger--stack"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          aria-label={`${ariaLabel}. ${toggleTip}.`}
        >
          <div className="weather-ten-day-stack-main">
            <WeatherConditionIcon code={day.code} size={28} />
            <div className="min-w-0">
              <HudTip tip={dayTooltip}>
                <p className="weather-ten-day-day">{dayLabel}</p>
              </HudTip>
              <p className="weather-ten-day-summary">{day.summary}</p>
            </div>
          </div>
          <div className="weather-ten-day-trigger-end">
            <p className="weather-ten-day-temps">
              <TemperatureHighLowRange
                high={day.high}
                low={day.low}
                unit={temperatureUnit}
                locale={displayLocale}
              />
            </p>
            <HudTip tip={toggleTip}>
              <span className="weather-ten-day-chevron" aria-hidden>
                {chevron}
              </span>
            </HudTip>
          </div>
        </button>
        {isExpanded ? (
          <div id={detailsId} className="weather-ten-day-details">
            <dl className="weather-ten-day-detail-grid">
              {detailRows.map((row) => (
                <React.Fragment key={row.label}>
                  <dt className="weather-ten-day-detail-label">
                    <row.Icon
                      size={14}
                      strokeWidth={2}
                      className="weather-ten-day-detail-icon"
                      aria-hidden
                    />
                    <span>{row.label}</span>
                  </dt>
                  <dd>{row.value}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        isExpanded
          ? "weather-ten-day-item weather-ten-day-item--row weather-ten-day-item--expanded"
          : "weather-ten-day-item weather-ten-day-item--row"
      }
    >
      <button
        type="button"
        className="weather-ten-day-trigger weather-ten-day-trigger--row"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        aria-label={`${ariaLabel}. ${toggleTip}.`}
      >
        <HudTip tip={dayTooltip}>
          <p className="weather-ten-day-day">{dayLabel}</p>
        </HudTip>
        <WeatherConditionIcon code={day.code} size={24} />
        <p className="weather-ten-day-temps">
          <TemperatureHighLowRange
            high={day.high}
            low={day.low}
            unit={temperatureUnit}
            locale={displayLocale}
          />
        </p>
        <HudTip tip={toggleTip}>
          <span className="weather-ten-day-chevron" aria-hidden>
            {chevron}
          </span>
        </HudTip>
      </button>
      {isExpanded ? (
        <div id={detailsId} className="weather-ten-day-details">
          <dl className="weather-ten-day-detail-grid">
            {detailRows.map((row) => (
              <React.Fragment key={row.label}>
                <dt className="weather-ten-day-detail-label">
                  <row.Icon
                    size={14}
                    strokeWidth={2}
                    className="weather-ten-day-detail-icon"
                    aria-hidden
                  />
                  <span>{row.label}</span>
                </dt>
                <dd>{row.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      ) : null}
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
  onSelectExplicitTemperatureUnit: (next: TWeatherTemperatureUnit) => void;
}) {
  const [forecast, setForecast] = useState<IWeatherForecast | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [tenDayContainerWidthPx, setTenDayContainerWidthPx] = useState<number | null>(null);
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);
  const tenDayContainerRef = useRef<HTMLDivElement | null>(null);
  const activePanelView = resolveWeatherPanelView(panelView, lakesEmbedEnabled);
  const effectiveTenDayLayout = resolveWeatherTenDayLayout(tenDayLayout, tenDayContainerWidthPx);

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

  useEffect(() => {
    if (activePanelView !== "tenDay") {
      setTenDayContainerWidthPx(null);
      setExpandedDayDate(null);
      return;
    }
    const el = tenDayContainerRef.current;
    if (!el) return;

    const measure = (): void => {
      setTenDayContainerWidthPx(el.clientWidth);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [activePanelView, forecast, err]);

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
                ref={tenDayContainerRef}
                className={
                  effectiveTenDayLayout === "stack"
                    ? "weather-ten-day-stack"
                    : "weather-ten-day-row"
                }
                aria-label="10-day forecast"
              >
                {forecast.daily.map((day) => (
                  <WeatherTenDayRow
                    key={day.date}
                    day={day}
                    temperatureUnit={effectiveTemperatureUnit}
                    displayLocale={displayLocale}
                    layout={effectiveTenDayLayout}
                    isExpanded={expandedDayDate === day.date}
                    onToggle={() => {
                      setExpandedDayDate((prev) => (prev === day.date ? null : day.date));
                    }}
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
                    <TemperatureValue
                      value={current.temperature}
                      unit={current.temperatureUnit}
                      locale={displayLocale}
                    />
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
