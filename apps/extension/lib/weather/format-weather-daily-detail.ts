import type { TWeatherTemperatureUnit } from "./weather-units";

/** Eight-point compass label from Open-Meteo wind direction degrees. */
export function formatWindDirectionCompass(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
  const index = Math.round(degrees / 45) % 8;
  return directions[index] ?? "N";
}

export function formatPrecipChancePercent(chance: number | null): string | null {
  if (chance == null || !Number.isFinite(chance)) return null;
  return `${Math.round(chance)}%`;
}

export function formatPrecipSum(
  amount: number | null,
  temperatureUnit: TWeatherTemperatureUnit,
  locale: string,
): string | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  const suffix = temperatureUnit === "fahrenheit" ? " in" : " mm";
  return `${formatted}${suffix}`;
}

export function formatWindSpeedMax(
  speed: number | null,
  directionDegrees: number | null,
  temperatureUnit: TWeatherTemperatureUnit,
  locale: string,
): string | null {
  if (speed == null || !Number.isFinite(speed)) return null;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(speed);
  const unit = temperatureUnit === "fahrenheit" ? " mph" : " km/h";
  const direction =
    directionDegrees != null && Number.isFinite(directionDegrees)
      ? ` ${formatWindDirectionCompass(directionDegrees)}`
      : "";
  return `${formatted}${unit}${direction}`;
}

export function formatUvIndexMax(uv: number | null, locale: string): string | null {
  if (uv == null || !Number.isFinite(uv)) return null;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(uv);
  return formatted;
}

/** Formats an Open-Meteo local ISO time (e.g. `2026-06-09T06:12`) for display. */
export function formatWeatherSunTime(isoLocal: string | null, locale: string): string | null {
  if (!isoLocal) return null;
  const date = new Date(isoLocal);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
