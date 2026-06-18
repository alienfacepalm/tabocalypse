import type { TClockHourFormat } from "../clock-hour-format";

/** Hover tip / screen-reader detail for the speed test "Last run" header. */
export function formatSpeedTestLastRunTimestamp(
  completedAtMs: number,
  locale: string,
  hourFormat: TClockHourFormat,
): string {
  return new Date(completedAtMs).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: hourFormat === "12h",
  });
}
