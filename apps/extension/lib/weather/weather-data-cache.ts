import browser from "webextension-polyfill";
import type { ILakesBuoyEntry } from "./fetch-lakes-buoy-data";
import type { IWeatherForecast } from "./fetch-weather";
import type { TWeatherTemperatureUnit } from "./weather-units";

export const WEATHER_DATA_CACHE_STORAGE_KEY = "tabocalypseWeatherDataCacheV1";

export interface IWeatherCacheEntry<TPayload> {
  payload: TPayload;
  fetchedAt: number;
}

export interface IWeatherDataCacheState {
  openMeteo: Record<string, IWeatherCacheEntry<IWeatherForecast>>;
  lakesBuoys: Record<string, IWeatherCacheEntry<ILakesBuoyEntry[]>>;
}

function emptyCacheState(): IWeatherDataCacheState {
  return { openMeteo: {}, lakesBuoys: {} };
}

export function formatCoordinateForWeatherCacheKey(value: number): string {
  return value.toFixed(4);
}

export function openMeteoWeatherCacheKey(
  lat: number,
  lon: number,
  temperatureUnit: TWeatherTemperatureUnit,
): string {
  return `${formatCoordinateForWeatherCacheKey(lat)}:${formatCoordinateForWeatherCacheKey(lon)}:${temperatureUnit}`;
}

export function lakesBuoyWeatherCacheKey(temperatureUnit: TWeatherTemperatureUnit): string {
  return temperatureUnit;
}

function normalizeCacheState(raw: unknown): IWeatherDataCacheState {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyCacheState();
  }
  const body = raw as Partial<IWeatherDataCacheState>;
  const openMeteo =
    body.openMeteo && typeof body.openMeteo === "object" && !Array.isArray(body.openMeteo)
      ? body.openMeteo
      : {};
  const lakesBuoys =
    body.lakesBuoys && typeof body.lakesBuoys === "object" && !Array.isArray(body.lakesBuoys)
      ? body.lakesBuoys
      : {};
  return { openMeteo, lakesBuoys };
}

async function loadCacheState(): Promise<IWeatherDataCacheState> {
  const r = await browser.storage.local.get(WEATHER_DATA_CACHE_STORAGE_KEY);
  return normalizeCacheState(r[WEATHER_DATA_CACHE_STORAGE_KEY]);
}

async function persistCacheState(cache: IWeatherDataCacheState): Promise<void> {
  await browser.storage.local.set({ [WEATHER_DATA_CACHE_STORAGE_KEY]: cache });
}

export async function readOpenMeteoWeatherCache(
  lat: number,
  lon: number,
  temperatureUnit: TWeatherTemperatureUnit,
): Promise<IWeatherCacheEntry<IWeatherForecast> | null> {
  const cache = await loadCacheState();
  const key = openMeteoWeatherCacheKey(lat, lon, temperatureUnit);
  const entry = cache.openMeteo[key];
  if (!entry || typeof entry.fetchedAt !== "number" || !entry.payload) return null;
  return entry;
}

export async function writeOpenMeteoWeatherCache(
  lat: number,
  lon: number,
  temperatureUnit: TWeatherTemperatureUnit,
  forecast: IWeatherForecast,
  fetchedAt: number = Date.now(),
): Promise<void> {
  const cache = await loadCacheState();
  const key = openMeteoWeatherCacheKey(lat, lon, temperatureUnit);
  cache.openMeteo[key] = { payload: forecast, fetchedAt };
  await persistCacheState(cache);
}

export async function readLakesBuoyWeatherCache(
  temperatureUnit: TWeatherTemperatureUnit,
): Promise<IWeatherCacheEntry<ILakesBuoyEntry[]> | null> {
  const cache = await loadCacheState();
  const key = lakesBuoyWeatherCacheKey(temperatureUnit);
  const entry = cache.lakesBuoys[key];
  if (!entry || typeof entry.fetchedAt !== "number" || !Array.isArray(entry.payload)) return null;
  return entry;
}

export async function writeLakesBuoyWeatherCache(
  temperatureUnit: TWeatherTemperatureUnit,
  buoys: ILakesBuoyEntry[],
  fetchedAt: number = Date.now(),
): Promise<void> {
  const cache = await loadCacheState();
  const key = lakesBuoyWeatherCacheKey(temperatureUnit);
  cache.lakesBuoys[key] = { payload: buoys, fetchedAt };
  await persistCacheState(cache);
}
