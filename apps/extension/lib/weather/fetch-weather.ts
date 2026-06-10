import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import { parseOpenMeteoForecastPayload } from "./parse-open-meteo-forecast";
import type { TWeatherTemperatureUnit } from "./weather-units";

export interface IWeatherSnapshot {
  temperature: number;
  temperatureUnit: TWeatherTemperatureUnit;
  code: number;
  summary: string;
}

export interface IWeatherDayForecast {
  date: string;
  code: number;
  summary: string;
  high: number;
  low: number;
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
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "10");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", temperatureUnit);

  const data = (await privilegedExtensionFetchJson(url.toString())) as Parameters<
    typeof parseOpenMeteoForecastPayload
  >[0];
  return parseOpenMeteoForecastPayload(data, temperatureUnit);
}
