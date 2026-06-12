export function formatWeatherStaleTimestamp(fetchedAt: number, displayLocale: string): string {
  return new Intl.DateTimeFormat(displayLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fetchedAt));
}
