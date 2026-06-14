import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import { parseOpenMeteoForecastPayload } from "./parse-open-meteo-forecast";
import type { TWeatherTemperatureUnit } from "./weather-units";

export interface IWeatherSnapshot {
  temperature: number;
  temperatureUnit: TWeatherTemperatureUnit;
  code: number;
  summary: string;
  feelsLike: number | null;
  windSpeed: number | null;
  windDirectionDegrees: number | null;
  relativeHumidityPercent: number | null;
  precipitation: number | null;
}

export interface IWeatherDayForecast {
  date: string;
  code: number;
  summary: string;
  high: number;
  low: number;
  precipChancePercent: number | null;
  precipSum: number | null;
  windSpeedMax: number | null;
  windDirectionDegrees: number | null;
  uvIndexMax: number | null;
  sunrise: string | null;
  sunset: string | null;
  feelsLikeHigh: number | null;
  feelsLikeLow: number | null;
}

export interface IWeatherForecast {
  current: IWeatherSnapshot;
  daily: IWeatherDayForecast[];
}

export { summarizeWeatherCode } from "./summarize-weather-code";
export { parseOpenMeteoForecastPayload } from "./parse-open-meteo-forecast";

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  temperatureUnit: TWeatherTemperatureUnit,
): Promise<IWeatherForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "weather_code",
      "apparent_temperature",
      "wind_speed_10m",
      "wind_direction_10m",
      "relative_humidity_2m",
      "precipitation",
    ].join(","),
  );
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
      "wind_direction_10m_dominant",
      "uv_index_max",
      "sunrise",
      "sunset",
    ].join(","),
  );
  url.searchParams.set("forecast_days", "10");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", temperatureUnit);
  url.searchParams.set("wind_speed_unit", temperatureUnit === "fahrenheit" ? "mph" : "kmh");
  url.searchParams.set("precipitation_unit", temperatureUnit === "fahrenheit" ? "inch" : "mm");

  const data = (await privilegedExtensionFetchJson(url.toString())) as Parameters<
    typeof parseOpenMeteoForecastPayload
  >[0];
  return parseOpenMeteoForecastPayload(data, temperatureUnit);
}
