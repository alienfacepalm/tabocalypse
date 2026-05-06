/** How the clock panel shows the time of day (synced preference). */
export type TClockHourFormat = "12h" | "24h";

export const CLOCK_HOUR_FORMATS: TClockHourFormat[] = ["12h", "24h"];

export function coerceClockHourFormat(
  value: unknown,
  fallback: TClockHourFormat,
): TClockHourFormat {
  return value === "12h" || value === "24h" ? value : fallback;
}

/** Plain-language labels for clock format controls. */
export const CLOCK_HOUR_FORMAT_LABELS: Record<TClockHourFormat, string> = {
  "12h": "12-hour",
  "24h": "24-hour",
};

/** Label for matching clock style to the browser locale. */
export const CLOCK_HOUR_FORMAT_AUTO_LABEL = "Automatic";
