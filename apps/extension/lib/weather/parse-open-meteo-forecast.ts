import type { TWeatherTemperatureUnit } from "./weather-units";
import type { IWeatherDayForecast, IWeatherForecast, IWeatherSnapshot } from "./fetch-weather";
import { summarizeWeatherCode } from "./summarize-weather-code";

interface IOpenMeteoForecastPayload {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    apparent_temperature?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    apparent_temperature_max?: number[];
    apparent_temperature_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
    wind_direction_10m_dominant?: number[];
    uv_index_max?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
}

function readOptionalNumber(values: number[] | undefined, index: number): number | null {
  const value = values?.[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readOptionalString(values: string[] | undefined, index: number): string | null {
  const value = values?.[index];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readOptionalFiniteNumber(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
  const feelsLikeHighs = data.daily?.apparent_temperature_max ?? [];
  const feelsLikeLows = data.daily?.apparent_temperature_min ?? [];
  const precipChances = data.daily?.precipitation_probability_max ?? [];
  const precipSums = data.daily?.precipitation_sum ?? [];
  const windSpeeds = data.daily?.wind_speed_10m_max ?? [];
  const windDirections = data.daily?.wind_direction_10m_dominant ?? [];
  const uvIndexes = data.daily?.uv_index_max ?? [];
  const sunrises = data.daily?.sunrise ?? [];
  const sunsets = data.daily?.sunset ?? [];
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
      precipChancePercent: readOptionalNumber(precipChances, i),
      precipSum: readOptionalNumber(precipSums, i),
      windSpeedMax: readOptionalNumber(windSpeeds, i),
      windDirectionDegrees: readOptionalNumber(windDirections, i),
      uvIndexMax: readOptionalNumber(uvIndexes, i),
      sunrise: readOptionalString(sunrises, i),
      sunset: readOptionalString(sunsets, i),
      feelsLikeHigh: readOptionalNumber(feelsLikeHighs, i),
      feelsLikeLow: readOptionalNumber(feelsLikeLows, i),
    });
  }

  if (daily.length === 0) throw new Error("Bad weather payload");

  const current: IWeatherSnapshot = {
    temperature: t,
    temperatureUnit,
    code,
    summary: summarizeWeatherCode(code),
    feelsLike: readOptionalFiniteNumber(data.current?.apparent_temperature),
    windSpeed: readOptionalFiniteNumber(data.current?.wind_speed_10m),
    windDirectionDegrees: readOptionalFiniteNumber(data.current?.wind_direction_10m),
    relativeHumidityPercent: readOptionalFiniteNumber(data.current?.relative_humidity_2m),
    precipitation: readOptionalFiniteNumber(data.current?.precipitation),
  };

  return { current, daily };
}
