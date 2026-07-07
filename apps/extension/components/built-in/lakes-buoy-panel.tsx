import React, { useCallback, useEffect, useId, useState } from "react";
import { PanelFetchError } from "../panel-sdk";
import { WeatherStaleNotice } from "../weather-stale-notice";
import {
  LAKES_BUOY_NO_ACTIVE_DATA_ERROR,
  LAKES_BUOY_STATUS_ACTIVE,
  LAKES_BUOY_STATUS_WATER_TEMP_MISSING,
  LAKES_BUOY_STATUS_WATER_TEMP_MISSING_DETAIL,
  type ILakesBuoyEntry,
  type ILakesBuoySnapshot,
} from "../../lib/weather/fetch-lakes-buoy-data";
import { loadLakesBuoyData } from "../../lib/weather/load-lakes-buoy-data";
import { TemperatureValue } from "../temperature-value";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { BuoyConditionIcon } from "../../lib/weather/weather-condition-icon";
import type { TWeatherTemperatureUnit } from "../../lib/weather/weather-units";

type TPanelLoadState =
  | { status: "loading" }
  | { status: "ready"; buoys: ILakesBuoyEntry[]; stale: boolean; fetchedAt: number }
  | { status: "error"; message: string };

function lakeHeroAriaLabel(label: string, data: ILakesBuoySnapshot, displayLocale: string): string {
  const water =
    data.waterTemp == null
      ? `${LAKES_BUOY_STATUS_WATER_TEMP_MISSING}. ${LAKES_BUOY_STATUS_WATER_TEMP_MISSING_DETAIL}`
      : `water ${formatTemperatureValue(data.waterTemp, data.temperatureUnit, displayLocale)}`;
  const status =
    data.status === LAKES_BUOY_STATUS_ACTIVE
      ? "active"
      : "live sensor with missing water temperature";
  return `${label}, ${water}, ${data.condition}, ${status}`;
}

function formatOptionalNumber(value: number | null, suffix = ""): string {
  if (value == null) return "—";
  return `${value}${suffix}`;
}

export function LakesBuoyPanel({
  temperatureUnit,
  displayLocale,
}: {
  temperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
}) {
  const panelIdPrefix = useId();
  const [openLakeId, setOpenLakeId] = useState<string | null>(null);
  const [panelState, setPanelState] = useState<TPanelLoadState>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  const loadBuoys = useCallback(() => {
    let cancelled = false;
    setPanelState({ status: "loading" });

    void loadLakesBuoyData(temperatureUnit)
      .then((result) => {
        if (cancelled) return;
        setPanelState({
          status: "ready",
          buoys: result.buoys,
          stale: result.stale,
          fetchedAt: result.fetchedAt,
        });
        setOpenLakeId((prev) => (prev && result.buoys.some((b) => b.id === prev) ? prev : null));
      })
      .catch((e) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Buoy data failed";
          setPanelState({ status: "error", message });
          setOpenLakeId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [temperatureUnit]);

  useEffect(() => loadBuoys(), [loadBuoys, reloadToken]);

  const retryBuoyFetch = (): void => {
    setReloadToken((n) => n + 1);
  };

  const toggleLake = (lakeId: string): void => {
    setOpenLakeId((prev) => (prev === lakeId ? null : lakeId));
  };

  if (panelState.status === "loading") {
    return <p className="muted">Loading buoy data…</p>;
  }

  if (panelState.status === "error") {
    const showTwoLakesVerifyLink = panelState.message === LAKES_BUOY_NO_ACTIVE_DATA_ERROR;

    return (
      <PanelFetchError
        message={panelState.message}
        onRetry={retryBuoyFetch}
        retryTip="Try fetching King County lake buoy readings again"
        retryAriaLabel="Retry lake buoy data"
        supplement={
          showTwoLakesVerifyLink ? (
            <p className="muted m-0 text-xs leading-relaxed">
              Check live readings on{" "}
              <a href="https://2lakes.app" target="_blank" rel="noreferrer" className="linkish">
                2lakes.app
              </a>{" "}
              to confirm whether the buoys are reporting.
            </p>
          ) : undefined
        }
      />
    );
  }

  const { buoys, stale, fetchedAt } = panelState;

  if (buoys.length === 0) {
    return <p className="muted">No buoy readings available.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {stale ? (
        <WeatherStaleNotice
          dataLabel="buoy readings"
          fetchedAt={fetchedAt}
          displayLocale={displayLocale}
        />
      ) : null}
      <div
        className="weather-lakes-stack"
        role="region"
        aria-label="Lake Washington and Lake Sammamish buoy readings"
      >
        {buoys.map((buoy) => {
          const { data } = buoy;
          const isOpen = openLakeId === buoy.id;
          const bodyId = `${panelIdPrefix}-${buoy.id}-body`;
          const waterTempMissing = data.status === LAKES_BUOY_STATUS_WATER_TEMP_MISSING;

          return (
            <div key={buoy.id} className="weather-lakes-item" data-open={isOpen ? "" : undefined}>
              <button
                type="button"
                className="weather-lakes-summary"
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => toggleLake(buoy.id)}
              >
                <BuoyConditionIcon condition={data.condition} />
                <div
                  className="min-w-0 flex-1"
                  aria-label={lakeHeroAriaLabel(buoy.label, data, displayLocale)}
                >
                  <p className="weather-condition-label mt-0">
                    <span
                      className={
                        waterTempMissing
                          ? "weather-lakes-status-dot weather-lakes-status-dot--partial"
                          : "weather-lakes-status-dot weather-lakes-status-dot--active"
                      }
                      aria-hidden
                    />
                    <span>{buoy.label}</span>
                  </p>
                  {waterTempMissing ? (
                    <>
                      <p className="weather-lakes-status-heading">{data.status}</p>
                      <p className="weather-lakes-status-detail">
                        {LAKES_BUOY_STATUS_WATER_TEMP_MISSING_DETAIL}
                      </p>
                    </>
                  ) : data.waterTemp != null ? (
                    <p className="weather-temp">
                      <TemperatureValue
                        value={data.waterTemp}
                        unit={data.temperatureUnit}
                        locale={displayLocale}
                      />
                    </p>
                  ) : null}
                  <p className="weather-condition-label">
                    <span>{data.condition}</span>
                    {!waterTempMissing ? (
                      <span className="normal-case tracking-normal opacity-80">
                        · {LAKES_BUOY_STATUS_ACTIVE}
                      </span>
                    ) : null}
                  </p>
                </div>
                <span className="weather-lakes-summary-status text-muted normal-case tracking-normal">
                  {data.condition}
                </span>
              </button>
              {isOpen ? (
                <div id={bodyId} className="weather-lakes-body">
                  <dl className="weather-lakes-stat-grid">
                    <dt className="weather-lakes-stat-label">Water</dt>
                    <dd>
                      {waterTempMissing ? (
                        <span className="text-xs leading-snug text-muted">
                          {LAKES_BUOY_STATUS_WATER_TEMP_MISSING_DETAIL}
                        </span>
                      ) : data.waterTemp != null ? (
                        <TemperatureValue
                          value={data.waterTemp}
                          unit={data.temperatureUnit}
                          locale={displayLocale}
                        />
                      ) : (
                        "—"
                      )}
                    </dd>
                    <dt className="weather-lakes-stat-label">Air</dt>
                    <dd>
                      {data.airTemp == null ? (
                        "—"
                      ) : (
                        <TemperatureValue
                          value={data.airTemp}
                          unit={data.temperatureUnit}
                          locale={displayLocale}
                        />
                      )}
                    </dd>
                    <dt className="weather-lakes-stat-label">Wind</dt>
                    <dd>{formatOptionalNumber(data.windSpeed, " mph")}</dd>
                    <dt className="weather-lakes-stat-label">Humidity</dt>
                    <dd>{formatOptionalNumber(data.humidity, "%")}</dd>
                    <dt className="weather-lakes-stat-label">Updated</dt>
                    <dd className="text-xs">{data.timestamp}</dd>
                  </dl>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
