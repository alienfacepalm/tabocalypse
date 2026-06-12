/** True when an Open-Meteo daily `time` value (YYYY-MM-DD) is today in local time. */
export function isWeatherDateToday(isoDate: string, now = new Date()): boolean {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return isoDate === `${y}-${m}-${d}`;
}
