import { fetchOpenMeteo, type IWeatherForecast } from "./fetch-weather";
import { readOpenMeteoWeatherCache, writeOpenMeteoWeatherCache } from "./weather-data-cache";
import type { TWeatherTemperatureUnit } from "./weather-units";

export interface ILoadOpenMeteoForecastResult {
  forecast: IWeatherForecast;
  stale: boolean;
  fetchedAt: number;
}

export async function loadOpenMeteoForecast(
  lat: number,
  lon: number,
  temperatureUnit: TWeatherTemperatureUnit,
): Promise<ILoadOpenMeteoForecastResult> {
  try {
    const forecast = await fetchOpenMeteo(lat, lon, temperatureUnit);
    const fetchedAt = Date.now();
    await writeOpenMeteoWeatherCache(lat, lon, temperatureUnit, forecast, fetchedAt);
    return { forecast, stale: false, fetchedAt };
  } catch (e: unknown) {
    const cached = await readOpenMeteoWeatherCache(lat, lon, temperatureUnit);
    if (cached) {
      return {
        forecast: cached.payload,
        stale: true,
        fetchedAt: cached.fetchedAt,
      };
    }
    throw e;
  }
}
