import type { TWeatherTemperatureUnit } from "./weather-units";

/** Fahrenheit band ceilings from [2lakes.app](https://2lakes.app) (first band where temp < max wins). */
export const TEMPERATURE_COLOR_FAHRENHEIT_BAND_MAX = [45, 55, 65, 75, 85, 100, 125] as const;

export const TEMPERATURE_COLOR_CLASSES = [
  "temp-color-indigo",
  "temp-color-blue",
  "temp-color-cyan",
  "temp-color-emerald",
  "temp-color-amber",
  "temp-color-orange",
  "temp-color-red",
] as const;

export type TTemperatureColorBand =
  | "indigo"
  | "blue"
  | "cyan"
  | "emerald"
  | "amber"
  | "orange"
  | "red"
  | "red-hot"
  | "neutral";

/** Dark HUD hex values from DESIGN.md / 2lakes.app bands. */
export const TEMPERATURE_COLOR_HEX: Record<Exclude<TTemperatureColorBand, "neutral">, string> = {
  indigo: "#818cf8",
  blue: "#60a5fa",
  cyan: "#22d3ee",
  emerald: "#34d399",
  amber: "#fbbf24",
  orange: "#fb923c",
  red: "#ef4444",
  "red-hot": "#dc2626",
};

const BAND_NAMES: TTemperatureColorBand[] = [
  "indigo",
  "blue",
  "cyan",
  "emerald",
  "amber",
  "orange",
  "red",
];

/** Normalize to °F so Celsius and Fahrenheit readings share the same color bands. */
export function toFahrenheitForTemperatureColor(
  temperature: number,
  unit: TWeatherTemperatureUnit,
): number {
  return unit === "fahrenheit" ? temperature : (temperature * 9) / 5 + 32;
}

export function resolveTemperatureColorBand(
  temperature: number,
  unit: TWeatherTemperatureUnit,
): TTemperatureColorBand {
  if (!Number.isFinite(temperature)) return "neutral";
  const fahrenheit = toFahrenheitForTemperatureColor(temperature, unit);
  for (let i = 0; i < TEMPERATURE_COLOR_FAHRENHEIT_BAND_MAX.length; i += 1) {
    if (fahrenheit < TEMPERATURE_COLOR_FAHRENHEIT_BAND_MAX[i]) {
      return BAND_NAMES[i] ?? "neutral";
    }
  }
  return "red-hot";
}

export function resolveTemperatureColorClass(
  temperature: number,
  unit: TWeatherTemperatureUnit,
): string {
  const band = resolveTemperatureColorBand(temperature, unit);
  if (band === "red-hot") return "temp-color-red-hot";
  if (band === "neutral") return "temp-color-neutral";
  const index = BAND_NAMES.indexOf(band);
  return TEMPERATURE_COLOR_CLASSES[index] ?? "temp-color-neutral";
}

export function resolveTemperatureColorHex(
  temperature: number,
  unit: TWeatherTemperatureUnit,
): string | null {
  const band = resolveTemperatureColorBand(temperature, unit);
  if (band === "neutral") return null;
  return TEMPERATURE_COLOR_HEX[band];
}
