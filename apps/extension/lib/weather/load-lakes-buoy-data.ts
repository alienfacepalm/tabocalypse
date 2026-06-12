import { fetchAllLakesBuoys, type ILakesBuoyEntry } from "./fetch-lakes-buoy-data";
import { readLakesBuoyWeatherCache, writeLakesBuoyWeatherCache } from "./weather-data-cache";
import type { TWeatherTemperatureUnit } from "./weather-units";

export interface ILoadLakesBuoyDataResult {
  buoys: ILakesBuoyEntry[];
  stale: boolean;
  fetchedAt: number;
}

export async function loadLakesBuoyData(
  temperatureUnit: TWeatherTemperatureUnit,
  signal?: AbortSignal,
): Promise<ILoadLakesBuoyDataResult> {
  try {
    const buoys = await fetchAllLakesBuoys(temperatureUnit, signal);
    const fetchedAt = Date.now();
    await writeLakesBuoyWeatherCache(temperatureUnit, buoys, fetchedAt);
    return { buoys, stale: false, fetchedAt };
  } catch (e: unknown) {
    const cached = await readLakesBuoyWeatherCache(temperatureUnit);
    if (cached && cached.payload.length > 0) {
      return {
        buoys: cached.payload,
        stale: true,
        fetchedAt: cached.fetchedAt,
      };
    }
    throw e;
  }
}
