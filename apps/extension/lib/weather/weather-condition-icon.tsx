import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Cloudy,
  Sun,
} from "lucide-react";
import React from "react";

export type TWeatherConditionKind =
  | "clear"
  | "partly"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

/** Map Open-Meteo WMO weather_code to a semantic condition kind for icon color. */
export function pickWeatherConditionKind(code: number): TWeatherConditionKind {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "cloud";
}

/** Map buoy condition text to a semantic condition kind for icon color. */
export function pickBuoyConditionKind(condition: string): TWeatherConditionKind {
  const c = condition.toLowerCase();
  if (c.includes("thunder")) return "storm";
  if (c.includes("rain") || c.includes("shower")) return "rain";
  if (c.includes("snow")) return "snow";
  if (c.includes("drizzle")) return "drizzle";
  if (c.includes("fog")) return "fog";
  if (c.includes("sunny") || c.includes("clear")) return "clear";
  if (c.includes("partly")) return "partly";
  if (c.includes("cloud") || c.includes("overcast")) return "cloud";
  return "cloud";
}

export function weatherConditionIconClassName(
  kind: TWeatherConditionKind,
  className?: string,
): string {
  return ["weather-condition-icon", `weather-condition-icon--${kind}`, className]
    .filter(Boolean)
    .join(" ");
}

/** Lucide sets SVG `stroke` from the `color` prop — CSS `color` alone is not enough. */
export function weatherConditionStrokeColor(kind: TWeatherConditionKind): string {
  const strokeByKind: Record<TWeatherConditionKind, string> = {
    clear: "var(--color-weather-clear)",
    partly: "var(--color-weather-partly)",
    cloud: "var(--color-weather-cloud)",
    fog: "var(--color-weather-fog)",
    drizzle: "var(--color-weather-drizzle)",
    rain: "var(--color-weather-rain)",
    snow: "var(--color-weather-snow)",
    storm: "var(--color-weather-storm)",
  };
  return strokeByKind[kind];
}

/** Map Open-Meteo WMO weather_code to a Lucide icon. */
export function pickWeatherConditionIcon(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code === 1) return Sun;
  if (code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloudy;
}

export function WeatherConditionIcon({
  code,
  className,
  size = 44,
}: {
  code: number;
  className?: string;
  size?: number;
}) {
  const Icon = pickWeatherConditionIcon(code);
  const kind = pickWeatherConditionKind(code);
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      color={weatherConditionStrokeColor(kind)}
      className={weatherConditionIconClassName(kind, className)}
      aria-hidden
    />
  );
}

/** Map lake buoy condition / wind summary text to a Lucide icon for the lakes panel. */
export function pickBuoyConditionIcon(condition: string): LucideIcon {
  const c = condition.toLowerCase();
  if (c.includes("thunder")) return CloudLightning;
  if (c.includes("rain") || c.includes("shower")) return CloudRain;
  if (c.includes("snow")) return CloudSnow;
  if (c.includes("drizzle")) return CloudDrizzle;
  if (c.includes("fog")) return CloudFog;
  if (c.includes("sunny") || c.includes("clear")) return Sun;
  if (c.includes("partly")) return CloudSun;
  if (c.includes("cloud") || c.includes("overcast")) return Cloud;
  return Cloudy;
}

export function BuoyConditionIcon({
  condition,
  className,
  size = 44,
}: {
  condition: string;
  className?: string;
  size?: number;
}) {
  const Icon = pickBuoyConditionIcon(condition);
  const kind = pickBuoyConditionKind(condition);
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      color={weatherConditionStrokeColor(kind)}
      className={weatherConditionIconClassName(kind, className)}
      aria-hidden
    />
  );
}
