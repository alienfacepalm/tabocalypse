import React from "react";
import { formatTemperatureValue } from "../lib/weather/format-weather-temperature";
import {
  resolveTemperatureColorClass,
  resolveTemperatureColorHex,
} from "../lib/weather/temperature-color-scale";
import type { TWeatherTemperatureUnit } from "../lib/weather/weather-units";

export function TemperatureValue({
  value,
  unit,
  locale,
  className = "",
}: {
  value: number;
  unit: TWeatherTemperatureUnit;
  locale: string;
  className?: string;
}) {
  const colorClass = resolveTemperatureColorClass(value, unit);
  const colorHex = resolveTemperatureColorHex(value, unit);
  return (
    <span
      className={`tabular-nums ${colorClass}${className ? ` ${className}` : ""}`}
      style={colorHex ? { color: colorHex } : undefined}
    >
      {formatTemperatureValue(value, unit, locale)}
    </span>
  );
}

export function TemperatureHighLowRange({
  high,
  low,
  unit,
  locale,
  className = "",
}: {
  high: number;
  low: number;
  unit: TWeatherTemperatureUnit;
  locale: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <TemperatureValue value={high} unit={unit} locale={locale} />
      <span className="text-muted" aria-hidden>
        {" "}
        /{" "}
      </span>
      <TemperatureValue value={low} unit={unit} locale={locale} />
    </span>
  );
}
