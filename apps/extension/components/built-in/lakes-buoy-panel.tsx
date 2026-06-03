import React, { useCallback, useEffect, useId, useState } from "react";
import { PrivilegedFetchErrorPanel } from "../privileged-fetch-error-panel";
import {
  fetchAllLakesBuoys,
  KING_COUNTY_LAKE_BUOY_HOME_URL,
  KING_COUNTY_LAKE_BUOY_PROVISIONAL_URL,
  type ILakesBuoyEntry,
  type ILakesBuoySnapshot,
} from "../../lib/weather/fetch-lakes-buoy-data";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import { BuoyConditionIcon } from "../../lib/weather/weather-condition-icon";
import type { TWeatherTemperatureUnit } from "../../lib/weather/weather-units";

type TPanelLoadState =
  | { status: "loading" }
  | { status: "ready"; buoys: ILakesBuoyEntry[] }
  | { status: "error"; message: string };

function lakeHeroAriaLabel(label: string, data: ILakesBuoySnapshot, displayLocale: string): string {
  return `${label}, water ${formatTemperatureValue(data.waterTemp, data.temperatureUnit, displayLocale)}, ${data.condition}`;
}

function formatOptionalTemperatureValue(
  temperature: number | null,
  unit: TWeatherTemperatureUnit,
  displayLocale: string,
): string {
  if (temperature == null) return "—";
  return formatTemperatureValue(temperature, unit, displayLocale);
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

    void fetchAllLakesBuoys(temperatureUnit)
      .then((buoys) => {
        if (cancelled) return;
        setPanelState({ status: "ready", buoys });
        setOpenLakeId((prev) => {
          if (prev && buoys.some((b) => b.id === prev)) return prev;
          return buoys[0]?.id ?? null;
        });
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
    return (
      <PrivilegedFetchErrorPanel
        message={panelState.message}
        onRetry={retryBuoyFetch}
        retryTip="Try fetching King County lake buoy readings again"
        retryAriaLabel="Retry lake buoy data"
      />
    );
  }

  const { buoys } = panelState;

  if (buoys.length === 0) {
    return <p className="muted">No buoy readings available.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="weather-lakes-stack"
        role="region"
        aria-label="Lake Washington and Lake Sammamish buoy readings"
      >
        {buoys.map((buoy) => {
          const { data } = buoy;
          const isOpen = openLakeId === buoy.id;
          const bodyId = `${panelIdPrefix}-${buoy.id}-body`;

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
                  <p className="weather-condition-label mt-0">{buoy.label}</p>
                  <p className="weather-temp">
                    {formatTemperatureValue(data.waterTemp, data.temperatureUnit, displayLocale)}
                  </p>
                  <p className="weather-condition-label">
                    <span>{data.condition}</span>
                    <span className="normal-case tracking-normal opacity-80">· {data.status}</span>
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
                      {formatTemperatureValue(data.waterTemp, data.temperatureUnit, displayLocale)}
                    </dd>
                    <dt className="weather-lakes-stat-label">Air</dt>
                    <dd>
                      {formatOptionalTemperatureValue(
                        data.airTemp,
                        data.temperatureUnit,
                        displayLocale,
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
      <p className="muted text-xs leading-tight mb-0">
        Provisional data from{" "}
        <a
          className="linkish"
          href={KING_COUNTY_LAKE_BUOY_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          King County lake buoys
        </a>
        .{" "}
        <a
          className="linkish"
          href={KING_COUNTY_LAKE_BUOY_PROVISIONAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Subject to revision
        </a>
        .
      </p>
    </div>
  );
}
