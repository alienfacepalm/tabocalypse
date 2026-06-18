import React, { useEffect, useMemo, useState } from "react";
import {
  CLOCK_HOUR_FORMAT_LABELS,
  CLOCK_HOUR_FORMATS,
  type TClockHourFormat,
} from "../../lib/clock-hour-format";
import {
  readNavigatorTimeZone,
  resolveTimezoneFromCoords,
} from "../../lib/resolve-timezone-from-coords";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import { ClockAlarmsSection } from "./clock-alarms-section";
import { ClockAnalogFace } from "./clock-analog-face";

export function ClockWidget({
  locale,
  hourFormat,
  lat,
  lon,
  showGeoAccuracyHint,
  onOpenGeoSettings,
  onSelectHourFormat,
}: {
  locale: string;
  hourFormat: TClockHourFormat;
  /** Shared HUD coordinates (same slice as Weather). */
  lat: number;
  lon: number;
  showGeoAccuracyHint: boolean;
  onOpenGeoSettings: () => void;
  onSelectHourFormat: (next: TClockHourFormat) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [timeZone, setTimeZone] = useState(() => readNavigatorTimeZone());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void resolveTimezoneFromCoords(lat, lon, controller.signal)
      .then((resolved) => {
        if (cancelled) return;
        setTimeZone(resolved ?? readNavigatorTimeZone());
      })
      .catch(() => {
        if (cancelled) return;
        setTimeZone(readNavigatorTimeZone());
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lat, lon]);

  const timeOpts = useMemo(
    () =>
      ({
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: hourFormat === "12h",
        timeZone,
      }) as const,
    [hourFormat, timeZone],
  );
  const dateOpts = useMemo(
    () =>
      ({
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone,
      }) as const,
    [timeZone],
  );

  return (
    <section className="card clock-card">
      <div className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <HudPanelTitleInline>Clock</HudPanelTitleInline>
          <div className="row wrap" role="group" aria-label="Clock format">
            {CLOCK_HOUR_FORMATS.map((f) => (
              <HudTip
                key={f}
                tip={
                  f === "12h"
                    ? "Always show time with AM or PM"
                    : "Always show time on a 24-hour scale (no AM/PM)"
                }
              >
                <button
                  type="button"
                  className={hourFormat === f ? "btn primary sm" : "btn sm"}
                  onClick={() => onSelectHourFormat(f)}
                >
                  {CLOCK_HOUR_FORMAT_LABELS[f]}
                </button>
              </HudTip>
            ))}
          </div>
        </div>
      </div>
      <HudPanelBody>
        <div className="clock-display-row">
          <div className="clock-digital">
            <div className="clock-time">{now.toLocaleTimeString(locale, timeOpts)}</div>
            <div className="clock-date muted">{now.toLocaleDateString(locale, dateOpts)}</div>
            <div className="clock-tz muted">{timeZone}</div>
          </div>
          <ClockAnalogFace timeZone={timeZone} />
        </div>
        {showGeoAccuracyHint ? (
          <p className="mt-2 text-xs leading-tight text-[var(--color-accent2)]">
            Default GEO location still active. Open{" "}
            <HudTip tip="Open Settings and jump to the Weather section">
              <button
                type="button"
                className="linkish p-0 text-xs"
                onClick={onOpenGeoSettings}
                aria-label="Open Settings and jump to the Weather section"
              >
                Settings &gt; Weather
              </button>
            </HudTip>{" "}
            from the gear button in the top bar, then update the coordinates so the clock matches
            your area.
          </p>
        ) : null}
        <ClockAlarmsSection locale={locale} hourFormat={hourFormat} />
      </HudPanelBody>
    </section>
  );
}
