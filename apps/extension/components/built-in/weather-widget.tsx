/**
 * Built-in HUD weather panel. Open-Meteo fetch + unit types live under `lib/weather/`.
 * Declarative plugin panels are rendered separately in `components/plugin-views.tsx`.
 */
import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  Droplets,
  LocateFixed,
  Minus,
  Plus,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useId, useState } from "react";
import { PanelBody, PanelFetchError, PanelTip, PanelTitleInline } from "../panel-sdk";
import {
  formatPrecipChancePercent,
  formatPrecipSum,
  formatUvIndexMax,
  formatWeatherSunTime,
  formatWindSpeedMax,
} from "../../lib/weather/format-weather-daily-detail";
import { TemperatureHighLowRange } from "../temperature-value";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { formatWeatherDayLabel } from "../../lib/weather/format-weather-day-label";
import { formatWeatherDayTooltip } from "../../lib/weather/format-weather-day-tooltip";
import { type IWeatherDayForecast, type IWeatherForecast } from "../../lib/weather/fetch-weather";
import { loadOpenMeteoForecast } from "../../lib/weather/load-open-meteo-forecast";
import { WeatherConditionIcon } from "../../lib/weather/weather-condition-icon";
import { WeatherStaleNotice } from "../weather-stale-notice";
import { LakesBuoyPanel } from "./lakes-buoy-panel";
import { WeatherForecastPanel } from "./weather-forecast-panel";
import { WeatherStaticMap } from "./weather-static-map";
import { WEATHER_STATIC_MAP_DEFAULT_ZOOM } from "../../lib/weather/weather-static-map-url";
import {
  fetchOnThisDayTrivia,
  type IOnThisDayFact,
} from "../../lib/weather/fetch-on-this-day-trivia";
import { isWeatherDateToday } from "../../lib/weather/is-weather-date-today";
import {
  formatTenDayRowSummary,
  resolveTenDayRowCondition,
} from "../../lib/weather/resolve-ten-day-row-condition";
import {
  loadWeatherHudEngagement,
  recordWeatherHudDailyCheckIn,
  type IWeatherHudEngagement,
} from "../../lib/weather/weather-hud-engagement";
import { resolveWeatherPanelView } from "../../lib/weather/weather-panel-view";
import {
  WEATHER_TEMPERATURE_UNITS,
  WEATHER_UNIT_LABELS,
  type TWeatherTemperatureUnit,
} from "../../lib/weather/weather-units";
import {
  useTabocalypsePersist as usePanelPersist,
  useTabocalypseSettings as usePanelSettings,
} from "../tabocalypse-settings-context";

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
  conditionCode,
  conditionSummary,
  temperatureUnit,
  displayLocale,
  isExpanded,
  onToggle,
}: {
  day: IWeatherDayForecast;
  conditionCode: number;
  conditionSummary: string;
  temperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const detailsId = useId();
  const dayLabel = formatWeatherDayLabel(day.date, displayLocale, "long");
  const dayTooltip = formatWeatherDayTooltip(day.date, displayLocale, day.summary);
  const detailRows = buildWeatherTenDayDetailRows(day, temperatureUnit, displayLocale);
  const ariaLabel = `${dayLabel}, high ${formatTemperatureValue(day.high, temperatureUnit, displayLocale)}, low ${formatTemperatureValue(day.low, temperatureUnit, displayLocale)}, ${conditionSummary}`;
  const toggleTip = isExpanded ? "Hide day details" : "Show day details";

  const chevron = isExpanded ? (
    <ChevronUp size={16} strokeWidth={2} aria-hidden />
  ) : (
    <ChevronDown size={16} strokeWidth={2} aria-hidden />
  );

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
          <WeatherConditionIcon code={conditionCode} size={28} />
          <div className="min-w-0">
            <PanelTip tip={dayTooltip}>
              <p className="weather-ten-day-day">{dayLabel}</p>
            </PanelTip>
            <p className="weather-ten-day-summary">{conditionSummary}</p>
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
          <PanelTip tip={toggleTip}>
            <span className="weather-ten-day-chevron" aria-hidden>
              {chevron}
            </span>
          </PanelTip>
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

export function WeatherWidget({
  lat,
  lon,
  showGeoAccuracyHint,
  onOpenWeatherSettings,
  geoStatus,
  onUseMyLocationOnce,
  effectiveTemperatureUnit,
  displayLocale,
  gamificationEnabled,
}: {
  lat: number;
  lon: number;
  showGeoAccuracyHint: boolean;
  onOpenWeatherSettings: () => void;
  geoStatus: "detecting" | "denied" | "unavailable" | null;
  onUseMyLocationOnce: () => void;
  effectiveTemperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  /** When true, Weather → Forecast shows streak/points and records daily check-ins. */
  gamificationEnabled: boolean;
}) {
  const s = usePanelSettings();
  const persist = usePanelPersist();
  const autoGeoEnabled = s.weatherAutoGeo;
  const lakesEmbedEnabled = s.weatherLakesEmbedEnabled;
  const mapZoomButtonsEnabled = s.weatherMapZoomButtonsEnabled;
  const mapScrollZoomEnabled = s.weatherMapScrollZoomEnabled;
  const mapDoubleClickZoomEnabled = s.weatherMapDoubleClickZoomEnabled;
  const panelView = s.weatherPanelView;
  const [forecast, setForecast] = useState<IWeatherForecast | null>(null);
  const [forecastStale, setForecastStale] = useState(false);
  const [forecastFetchedAt, setForecastFetchedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);
  const [engagement, setEngagement] = useState<IWeatherHudEngagement | null>(null);
  const [trivia, setTrivia] = useState<IOnThisDayFact[]>([]);
  const [mapZoom, setMapZoom] = useState<number>(WEATHER_STATIC_MAP_DEFAULT_ZOOM);
  const [mapZoomControlsOpen, setMapZoomControlsOpen] = useState(false);
  const activePanelView = resolveWeatherPanelView(panelView, lakesEmbedEnabled);

  useEffect(() => {
    setMapZoom(WEATHER_STATIC_MAP_DEFAULT_ZOOM);
  }, [lat, lon]);

  useEffect(() => {
    if (!mapZoomButtonsEnabled) {
      setMapZoomControlsOpen(false);
    }
  }, [mapZoomButtonsEnabled]);

  const loadForecast = useCallback(() => {
    let cancelled = false;
    setErr(null);
    setForecast(null);
    setForecastStale(false);
    setForecastFetchedAt(null);

    void loadOpenMeteoForecast(lat, lon, effectiveTemperatureUnit)
      .then((result) => {
        if (!cancelled) {
          setForecast(result.forecast);
          setForecastStale(result.stale);
          setForecastFetchedAt(result.fetchedAt);
        }
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
    if (!gamificationEnabled) {
      setEngagement(null);
      return;
    }
    if (activePanelView !== "forecast" || !forecast) {
      return;
    }
    let cancelled = false;
    void recordWeatherHudDailyCheckIn()
      .then((next) => {
        if (!cancelled) setEngagement(next);
      })
      .catch(() => {
        if (!cancelled) {
          void loadWeatherHudEngagement().then((row) => {
            if (!cancelled) setEngagement(row);
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePanelView, forecast, gamificationEnabled]);

  useEffect(() => {
    if (activePanelView !== "forecast" || !forecast) {
      setTrivia([]);
      return;
    }
    let cancelled = false;
    setTrivia([]);
    void fetchOnThisDayTrivia(new Date(), displayLocale.split("-")[0] ?? "en")
      .then((facts) => {
        if (!cancelled) setTrivia(facts);
      })
      .catch(() => {
        if (!cancelled) setTrivia([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activePanelView, forecast, displayLocale]);

  useEffect(() => {
    if (activePanelView !== "tenDay") {
      setExpandedDayDate(null);
    }
  }, [activePanelView]);

  const retryForecast = (): void => {
    setReloadToken((n) => n + 1);
  };

  const current = forecast?.current ?? null;
  const todayForecast = forecast?.daily[0] ?? null;
  const mapInteractive = mapZoomButtonsEnabled || mapScrollZoomEnabled || mapDoubleClickZoomEnabled;
  const mapHasInlineZoomControls = mapZoomButtonsEnabled && mapZoomControlsOpen;

  return (
    <section className="card flex flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {mapZoomButtonsEnabled ? (
              <PanelTip
                tip={mapZoomControlsOpen ? "Hide map zoom controls" : "Show map zoom controls"}
              >
                <button
                  type="button"
                  className="btn ghost icon-only sm"
                  aria-label={
                    mapZoomControlsOpen ? "Hide map zoom controls" : "Show map zoom controls"
                  }
                  aria-pressed={mapZoomControlsOpen}
                  onClick={() => setMapZoomControlsOpen((open) => !open)}
                >
                  <ZoomIn size={18} strokeWidth={2} aria-hidden />
                </button>
              </PanelTip>
            ) : null}
            <PanelTitleInline>Weather</PanelTitleInline>
            {mapHasInlineZoomControls ? (
              <div className="row gap-1" role="group" aria-label="Map zoom">
                <PanelTip tip="Zoom in">
                  <button
                    type="button"
                    className="btn ghost icon-only sm"
                    aria-label="Zoom in on the weather location map"
                    onClick={() => setMapZoom((z) => Math.min(17, Math.max(1, Math.round(z + 1))))}
                  >
                    <Plus size={18} strokeWidth={2} aria-hidden />
                  </button>
                </PanelTip>
                <PanelTip tip="Zoom out">
                  <button
                    type="button"
                    className="btn ghost icon-only sm"
                    aria-label="Zoom out on the weather location map"
                    onClick={() => setMapZoom((z) => Math.min(17, Math.max(1, Math.round(z - 1))))}
                  >
                    <Minus size={18} strokeWidth={2} aria-hidden />
                  </button>
                </PanelTip>
              </div>
            ) : null}
          </div>
          <div className="row wrap items-center gap-2">
            {!autoGeoEnabled ? (
              <div role="group" aria-label="Weather location">
                <PanelTip tip="Use your current location once (does not enable automatic location on future tabs).">
                  <button
                    type="button"
                    className="btn primary sm icon-only"
                    disabled={geoStatus === "detecting"}
                    aria-label="Use location once to set shared HUD coordinates"
                    onClick={onUseMyLocationOnce}
                  >
                    <LocateFixed size={18} strokeWidth={2} aria-hidden />
                  </button>
                </PanelTip>
              </div>
            ) : null}

            {!autoGeoEnabled &&
            (activePanelView === "forecast" ||
              activePanelView === "tenDay" ||
              activePanelView === "lakes") ? (
              <span className="h-5 w-px bg-border" aria-hidden />
            ) : null}

            {activePanelView === "forecast" ||
            activePanelView === "tenDay" ||
            activePanelView === "lakes" ? (
              <div className="row wrap gap-1" role="group" aria-label="Temperature units">
                {WEATHER_TEMPERATURE_UNITS.map((u) => (
                  <PanelTip
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
                      onClick={() =>
                        void persist((cur) => ({
                          ...cur,
                          weatherTemperatureUnitAuto: false,
                          weatherTemperatureUnit: u,
                        }))
                      }
                    >
                      {WEATHER_UNIT_LABELS[u]}
                    </button>
                  </PanelTip>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <WeatherStaticMap
          lat={lat}
          lon={lon}
          zoom={mapZoom}
          scrollZoomEnabled={mapInteractive && mapScrollZoomEnabled}
          doubleClickZoomEnabled={mapInteractive && mapDoubleClickZoomEnabled}
          onZoomIn={
            mapInteractive
              ? () => setMapZoom((z) => Math.min(17, Math.max(1, Math.round(z + 1))))
              : undefined
          }
          onZoomOut={
            mapInteractive
              ? () => setMapZoom((z) => Math.min(17, Math.max(1, Math.round(z - 1))))
              : undefined
          }
        />
        {showGeoAccuracyHint ? (
          <p className="mt-2 text-xs leading-tight text-[var(--color-accent2)]">
            Default GEO location still active. Open{" "}
            <PanelTip tip="Open Settings and jump to the Weather section">
              <button
                type="button"
                className="linkish p-0 text-xs"
                onClick={onOpenWeatherSettings}
                aria-label="Open Settings and jump to the Weather section"
              >
                Settings &gt; Weather
              </button>
            </PanelTip>{" "}
            from the gear button in the top bar, then update the shared coordinates so Weather,
            Clock, and related panels target your actual area.
          </p>
        ) : null}
        {!autoGeoEnabled && geoStatus === "denied" ? (
          <p className="muted sm mt-2" style={{ color: "var(--color-danger)" }}>
            Location permission denied. Allow location in your browser settings and try again, or
            update coordinates under <span className="font-bold">Settings &gt; Weather</span>.
          </p>
        ) : null}
        {!autoGeoEnabled && geoStatus === "unavailable" ? (
          <p className="muted sm mt-2" style={{ color: "var(--color-danger)" }}>
            Location is not available in this browser. Update coordinates under{" "}
            <span className="font-bold">Settings &gt; Weather</span>.
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="row wrap gap-1" role="group" aria-label="Weather panel view">
            <PanelTip tip="Show current conditions for your saved coordinates">
              <button
                type="button"
                className={activePanelView === "forecast" ? "btn primary sm" : "btn sm"}
                onClick={() => void persist((cur) => ({ ...cur, weatherPanelView: "forecast" }))}
              >
                Forecast
              </button>
            </PanelTip>
            <PanelTip tip="Show a 10-day high/low outlook from Open-Meteo">
              <button
                type="button"
                className={activePanelView === "tenDay" ? "btn primary sm" : "btn sm"}
                onClick={() => void persist((cur) => ({ ...cur, weatherPanelView: "tenDay" }))}
              >
                10 Day
              </button>
            </PanelTip>
            {lakesEmbedEnabled ? (
              <PanelTip tip="Show Lake Sammamish and Lake Washington buoy readings">
                <button
                  type="button"
                  className={activePanelView === "lakes" ? "btn primary sm" : "btn sm"}
                  onClick={() => void persist((cur) => ({ ...cur, weatherPanelView: "lakes" }))}
                >
                  2 Lakes
                </button>
              </PanelTip>
            ) : null}
          </div>
        </div>
      </div>
      <PanelBody>
        {activePanelView === "lakes" ? (
          <LakesBuoyPanel
            temperatureUnit={effectiveTemperatureUnit}
            displayLocale={displayLocale}
          />
        ) : activePanelView === "tenDay" ? (
          <>
            {err ? (
              <PanelFetchError
                message={err}
                onRetry={retryForecast}
                retryTip="Try fetching the Open-Meteo forecast again"
                retryAriaLabel="Retry weather forecast"
              />
            ) : null}
            {forecastStale && forecastFetchedAt != null ? (
              <WeatherStaleNotice
                dataLabel="forecast"
                fetchedAt={forecastFetchedAt}
                displayLocale={displayLocale}
              />
            ) : null}
            {forecast ? (
              <div className="weather-ten-day-stack" aria-label="10-day forecast">
                {forecast.daily.map((day) => {
                  const isToday = isWeatherDateToday(day.date);
                  const condition = resolveTenDayRowCondition(day, forecast.current, isToday);
                  const conditionSummary = formatTenDayRowSummary(condition);
                  return (
                    <WeatherTenDayRow
                      key={day.date}
                      day={day}
                      conditionCode={condition.code}
                      conditionSummary={conditionSummary}
                      temperatureUnit={effectiveTemperatureUnit}
                      displayLocale={displayLocale}
                      isExpanded={expandedDayDate === day.date}
                      onToggle={() => {
                        setExpandedDayDate((prev) => (prev === day.date ? null : day.date));
                      }}
                    />
                  );
                })}
              </div>
            ) : !err ? (
              <p className="muted">Loading…</p>
            ) : null}
          </>
        ) : (
          <>
            {err ? (
              <PanelFetchError
                message={err}
                onRetry={retryForecast}
                retryTip="Try fetching the Open-Meteo forecast again"
                retryAriaLabel="Retry weather forecast"
              />
            ) : null}
            {forecastStale && forecastFetchedAt != null ? (
              <WeatherStaleNotice
                dataLabel="forecast"
                fetchedAt={forecastFetchedAt}
                displayLocale={displayLocale}
              />
            ) : null}
            {current && todayForecast ? (
              <WeatherForecastPanel
                current={current}
                displayLocale={displayLocale}
                gamificationEnabled={gamificationEnabled}
                engagement={engagement}
                trivia={trivia}
              />
            ) : !err ? (
              <p className="muted">Loading…</p>
            ) : null}
          </>
        )}
      </PanelBody>
    </section>
  );
}
