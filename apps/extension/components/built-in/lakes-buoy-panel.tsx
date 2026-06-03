import { RotateCw } from "lucide-react";
import React, { useCallback, useEffect, useId, useState } from "react";
import { HudTip } from "../hud-tip";
import {
  isPrivilegedFetchAllowlistError,
  PRIV_FETCH_RELOAD_EXTENSION_HINT,
} from "../../lib/privileged-extension-fetch";
import { TWO_LAKES_API_KEY_SETTING_LABEL } from "../../lib/settings";
import {
  fetchAllLakesBuoys,
  LAKES_API_KEY_REQUIRED_MESSAGE,
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

export function LakesBuoyPanel({
  temperatureUnit,
  displayLocale,
  lakesApiKey,
  onOpenWeatherSettings,
}: {
  temperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  lakesApiKey: string;
  onOpenWeatherSettings: () => void;
}) {
  const panelIdPrefix = useId();
  const [openLakeId, setOpenLakeId] = useState<string | null>(null);
  const [panelState, setPanelState] = useState<TPanelLoadState>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  const loadBuoys = useCallback(() => {
    let cancelled = false;
    setPanelState({ status: "loading" });

    void fetchAllLakesBuoys(temperatureUnit, lakesApiKey)
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
  }, [temperatureUnit, lakesApiKey]);

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
    const showAllowlistReload = isPrivilegedFetchAllowlistError(panelState.message);

    return (
      <div className="flex flex-col gap-2">
        <p className="err">{panelState.message}</p>
        {showAllowlistReload ? (
          <>
            <p className="muted text-xs leading-tight">{PRIV_FETCH_RELOAD_EXTENSION_HINT}</p>
            <div className="row wrap gap-2">
              <HudTip tip="Fetch 2 Lakes buoy readings again after reloading the extension">
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={retryBuoyFetch}
                  aria-label="Reload 2 Lakes buoy data"
                >
                  <RotateCw size={16} strokeWidth={2} aria-hidden />
                  Reload
                </button>
              </HudTip>
            </div>
          </>
        ) : null}
        {!lakesApiKey.trim() ? (
          <p className="muted text-xs leading-tight">
            Open{" "}
            <a
              className="linkish"
              href="https://2lakes.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              2lakes.app
            </a>
            , go to Settings, generate an API key, then paste it in{" "}
            <button type="button" className="linkish p-0 text-xs" onClick={onOpenWeatherSettings}>
              Settings &gt; Weather
            </button>{" "}
            under {TWO_LAKES_API_KEY_SETTING_LABEL}.
          </p>
        ) : showAllowlistReload || panelState.message === LAKES_API_KEY_REQUIRED_MESSAGE ? null : (
          <p className="muted text-xs leading-tight">
            Check the key in{" "}
            <button type="button" className="linkish p-0 text-xs" onClick={onOpenWeatherSettings}>
              Settings &gt; Weather
            </button>
            . Generate a new one from Settings on{" "}
            <a
              className="linkish"
              href="https://2lakes.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              2lakes.app
            </a>{" "}
            if needed.
          </p>
        )}
      </div>
    );
  }

  const { buoys } = panelState;

  if (buoys.length === 0) {
    return <p className="muted">No buoy readings available.</p>;
  }

  return (
    <div className="weather-lakes-stack" role="region" aria-label="2 Lakes buoy readings">
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
                    {formatTemperatureValue(data.airTemp, data.temperatureUnit, displayLocale)}
                  </dd>
                  <dt className="weather-lakes-stat-label">Wind</dt>
                  <dd>{data.windSpeed} mph</dd>
                  <dt className="weather-lakes-stat-label">Humidity</dt>
                  <dd>{data.humidity}%</dd>
                  <dt className="weather-lakes-stat-label">Updated</dt>
                  <dd className="text-xs">{data.timestamp}</dd>
                </dl>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
