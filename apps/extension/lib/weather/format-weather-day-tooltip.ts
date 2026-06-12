/** Long-form day label for 10-day row hover tips (Open-Meteo `time` is YYYY-MM-DD). */
export function formatWeatherDayTooltip(isoDate: string, locale: string, summary: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const fullDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return `${fullDate} · ${summary}`;
}
