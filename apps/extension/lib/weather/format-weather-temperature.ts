import type { TWeatherTemperatureUnit } from "./weather-units";

export function formatTemperatureSuffix(unit: TWeatherTemperatureUnit): string {
  return unit === "celsius" ? "°C" : "°F";
}

export function formatTemperatureValue(temperature: number, unit: TWeatherTemperatureUnit): string {
  return `${temperature.toFixed(1)}${formatTemperatureSuffix(unit)}`;
}
