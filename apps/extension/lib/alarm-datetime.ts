import type { TClockHourFormat } from "./clock-hour-format";

/** Value for `input type="datetime-local"` `value` / `min` (local, minute precision). */
export function formatDatetimeLocalFromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Default alarm field: at least one minute from `from`, seconds cleared. */
export function defaultAlarmWhenLocal(from: Date = new Date()): string {
  const d = new Date(from.getTime() + 60_000);
  d.setSeconds(0, 0);
  return formatDatetimeLocalFromDate(d);
}

/** Scheduled-alarm list label; respects the global 12h / 24h clock preference. */
export function formatAlarmScheduledLabel(
  date: Date,
  locale: string,
  hourFormat: TClockHourFormat,
): string {
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: hourFormat === "12h",
  });
}
