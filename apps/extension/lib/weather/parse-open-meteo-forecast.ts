import type { TWeatherTemperatureUnit } from "./weather-units";
import type { IWeatherDayForecast, IWeatherForecast, IWeatherSnapshot } from "./fetch-weather";
import { summarizeWeatherCode } from "./summarize-weather-code";

interface IOpenMeteoForecastPayload {
  current?: { temperature_2m?: number; weather_code?: number };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
}

export function parseOpenMeteoForecastPayload(
  data: IOpenMeteoForecastPayload,
  temperatureUnit: TWeatherTemperatureUnit,
): IWeatherForecast {
  const t = data.current?.temperature_2m ?? NaN;
  const code = data.current?.weather_code ?? 0;
  if (Number.isNaN(t)) throw new Error("Bad weather payload");

  const times = data.daily?.time ?? [];
  const codes = data.daily?.weather_code ?? [];
  const highs = data.daily?.temperature_2m_max ?? [];
  const lows = data.daily?.temperature_2m_min ?? [];
  const dayCount = Math.min(times.length, codes.length, highs.length, lows.length, 10);
  const daily: IWeatherDayForecast[] = [];

  for (let i = 0; i < dayCount; i += 1) {
    const date = times[i];
    const high = highs[i];
    const low = lows[i];
    const dayCode = codes[i];
    if (typeof date !== "string" || !Number.isFinite(high) || !Number.isFinite(low)) continue;
    daily.push({
      date,
      code: typeof dayCode === "number" ? dayCode : 0,
      summary: summarizeWeatherCode(typeof dayCode === "number" ? dayCode : 0),
      high,
      low,
    });
  }

  if (daily.length === 0) throw new Error("Bad weather payload");

  const current: IWeatherSnapshot = {
    temperature: t,
    temperatureUnit,
    code,
    summary: summarizeWeatherCode(code),
  };

  return { current, daily };
}
