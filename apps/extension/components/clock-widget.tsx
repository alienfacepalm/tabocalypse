import React, { useEffect, useMemo, useState } from "react";
import {
  CLOCK_HOUR_FORMAT_LABELS,
  CLOCK_HOUR_FORMATS,
  type TClockHourFormat,
} from "../lib/clock-hour-format";
import { pickDailyLine, type IHumorContext } from "../lib/humor/engine";
import { HudPanelBody, HudPanelTitleInline } from "./hud-panel-drag-context";
import { HudTip } from "./hud-tip";

export function ClockWidget({
  humor,
  hourFormat,
  onHourFormatChange,
}: {
  humor: IHumorContext;
  hourFormat: TClockHourFormat;
  onHourFormatChange: (next: TClockHourFormat) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [subtitle, setSubtitle] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setSubtitle(pickDailyLine(humor)), 12000);
    setSubtitle(pickDailyLine(humor));
    return () => window.clearInterval(t);
  }, [humor]);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeOpts = useMemo(
    () =>
      ({
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: hourFormat === "12h",
      }) as const,
    [hourFormat],
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
                    ? "Show time with AM or PM"
                    : "Show time on a 24-hour scale (no AM/PM)"
                }
              >
                <button
                  type="button"
                  className={hourFormat === f ? "btn primary sm" : "btn sm"}
                  onClick={() => onHourFormatChange(f)}
                >
                  {CLOCK_HOUR_FORMAT_LABELS[f]}
                </button>
              </HudTip>
            ))}
          </div>
        </div>
      </div>
      <HudPanelBody>
        <div className="clock-time">{now.toLocaleTimeString(undefined, timeOpts)}</div>
        <div className="clock-date muted">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="clock-tz muted">{tz}</div>
        {subtitle ? <p className="clock-roast">{subtitle}</p> : null}
      </HudPanelBody>
    </section>
  );
}
