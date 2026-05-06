import type { TWeatherTemperatureUnit } from "./weather-units";

export function formatTemperatureSuffix(unit: TWeatherTemperatureUnit): string {
  return unit === "celsius" ? "°C" : "°F";
}

/**
 * Formats a temperature for display using `Intl` digit grouping / decimal rules for `locale`
 * (omit or pass `undefined` to use the runtime default locale).
 */
export function formatTemperatureValue(
  temperature: number,
  unit: TWeatherTemperatureUnit,
  locale?: string,
): string {
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(temperature);
  return `${formatted}${formatTemperatureSuffix(unit)}`;
}
