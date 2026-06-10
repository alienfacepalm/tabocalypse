/** Short weekday label for an Open-Meteo daily `time` value (YYYY-MM-DD). */
export function formatWeatherDayLabel(isoDate: string, locale: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}
