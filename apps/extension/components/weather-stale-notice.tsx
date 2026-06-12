import React from "react";
import { formatWeatherStaleTimestamp } from "../lib/weather/format-weather-stale-timestamp";

export function WeatherStaleNotice({
  dataLabel,
  fetchedAt,
  displayLocale,
}: {
  /** Plain-language label, e.g. "forecast" or "buoy readings". */
  dataLabel: string;
  fetchedAt: number;
  displayLocale: string;
}): React.JSX.Element {
  const when = formatWeatherStaleTimestamp(fetchedAt, displayLocale);

  return (
    <p
      className="mb-2 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-2 py-1.5 font-mono text-[10px] leading-snug text-[var(--color-accent2)]"
      role="status"
    >
      Showing saved {dataLabel} from {when}. Live data is temporarily unavailable.
    </p>
  );
}
