/** Open-Meteo `temperature_unit` and persisted settings value. */
export type TWeatherTemperatureUnit = "celsius" | "fahrenheit";

export const WEATHER_TEMPERATURE_UNITS: TWeatherTemperatureUnit[] = ["celsius", "fahrenheit"];

export function coerceWeatherTemperatureUnit(
  value: unknown,
  fallback: TWeatherTemperatureUnit,
): TWeatherTemperatureUnit {
  return value === "celsius" || value === "fahrenheit" ? value : fallback;
}

/** Plain-language labels for temperature unit controls (not storage literals in UI copy). */
export const WEATHER_UNIT_LABELS: Record<TWeatherTemperatureUnit, string> = {
  celsius: "Celsius",
  fahrenheit: "Fahrenheit",
};

/** Label for matching temperature units to the browser locale. */
export const WEATHER_TEMPERATURE_UNIT_AUTO_LABEL = "Automatic";
