import React, { useEffect, useState } from "react";
import { pickDailyLine, type HumorContext } from "../lib/humor/engine";

export function ClockWidget({ humor }: { humor: HumorContext }) {
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
  return (
    <section className="card clock-card">
      <h3>Clock</h3>
      <div className="clock-time">
        {now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
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
    </section>
  );
}
