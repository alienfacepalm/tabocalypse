import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import { TWO_LAKES_API_KEY_SETTING_LABEL } from "../settings";
import type { TWeatherTemperatureUnit } from "./weather-units";

/** Public site for full 2 Lakes experience (opened in a new tab from the Weather widget). */
export const LAKES_APP_URL = "https://2lakes.app/";

export const LAKES_ALL_BUOY_DATA_URL = "https://2lakes.app/api/all-buoy-data";

export interface ILakesBuoySnapshot {
  location: string;
  waterTemp: number;
  airTemp: number;
  windSpeed: number;
  humidity: number;
  condition: string;
  status: string;
  timestamp: string;
  temperatureUnit: TWeatherTemperatureUnit;
}

export interface ILakesBuoyEntry {
  id: string;
  label: string;
  data: ILakesBuoySnapshot;
}

export function lakesAllBuoyDataApiUrl(): string {
  return LAKES_ALL_BUOY_DATA_URL;
}

/** Bearer token for 2lakes.app `/api/all-buoy-data` (Authorization header). */
export function lakesBearerAuthorizationHeader(apiKey: string): Record<string, string> {
  const trimmed = apiKey.trim();
  if (!trimmed) return {};
  const token = trimmed.startsWith("Bearer ") ? trimmed.slice("Bearer ".length).trim() : trimmed;
  return { Authorization: `Bearer ${token}` };
}

export const LAKES_API_KEY_REQUIRED_MESSAGE =
  `Add your ${TWO_LAKES_API_KEY_SETTING_LABEL} in Settings > Weather.` as const;

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/** Maps one 2lakes.app buoy JSON object into a compact HUD snapshot. */
export function parseLakesBuoyPayload(
  data: unknown,
  temperatureUnit: TWeatherTemperatureUnit,
): ILakesBuoySnapshot {
  if (data == null || typeof data !== "object") {
    throw new Error("Bad buoy payload");
  }
  const row = data as Record<string, unknown>;
  const waterTemp =
    temperatureUnit === "celsius" ? readFiniteNumber(row.tempC) : readFiniteNumber(row.tempF);
  const airTemp =
    temperatureUnit === "celsius" ? readFiniteNumber(row.airTempC) : readFiniteNumber(row.airTempF);
  const windSpeed = readFiniteNumber(row.windSpeed);
  const humidity = readFiniteNumber(row.humidity);
  const location = readNonEmptyString(row.location);
  const condition = readNonEmptyString(row.condition);
  const status = readNonEmptyString(row.status);
  const timestamp = readNonEmptyString(row.timestamp);

  if (
    waterTemp == null ||
    airTemp == null ||
    windSpeed == null ||
    humidity == null ||
    !location ||
    !condition ||
    !status ||
    !timestamp
  ) {
    throw new Error("Bad buoy payload");
  }

  return {
    location,
    waterTemp,
    airTemp,
    windSpeed,
    humidity,
    condition,
    status,
    timestamp,
    temperatureUnit,
  };
}

export function lakesBuoyIdFromLocation(location: string): string {
  const slug = location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "buoy";
}

export function lakesBuoyDisplayLabel(location: string): string {
  const trimmed = location.replace(/\s+buoy\s*$/i, "").trim();
  return trimmed.length > 0 ? trimmed : location;
}

function parseApiErrorPayload(data: unknown): string | null {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const row = data as Record<string, unknown>;
  const message = readNonEmptyString(row.message);
  if (message) return message;
  const error = readNonEmptyString(row.error);
  return error;
}

function extractBuoyRows(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data != null && typeof data === "object") {
    const row = data as Record<string, unknown>;
    if (Array.isArray(row.buoys)) return row.buoys;
    if (Array.isArray(row.data)) return row.data;
  }
  return [];
}

/** Maps 2lakes.app `/api/all-buoy-data` JSON into accordion rows. */
export function parseAllLakesBuoysPayload(
  data: unknown,
  temperatureUnit: TWeatherTemperatureUnit,
): ILakesBuoyEntry[] {
  const apiError = parseApiErrorPayload(data);
  if (apiError) {
    throw new Error(apiError);
  }

  const rows = extractBuoyRows(data);
  if (rows.length === 0) {
    throw new Error("No buoy data returned");
  }

  const seenIds = new Set<string>();
  const buoys: ILakesBuoyEntry[] = [];

  for (const row of rows) {
    const snapshot = parseLakesBuoyPayload(row, temperatureUnit);
    let id = lakesBuoyIdFromLocation(snapshot.location);
    if (seenIds.has(id)) {
      id = `${id}-${buoys.length + 1}`;
    }
    seenIds.add(id);
    buoys.push({
      id,
      label: lakesBuoyDisplayLabel(snapshot.location),
      data: snapshot,
    });
  }

  return buoys;
}

export async function fetchAllLakesBuoys(
  temperatureUnit: TWeatherTemperatureUnit,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<ILakesBuoyEntry[]> {
  const trimmed = apiKey?.trim();
  if (!trimmed) {
    throw new Error(LAKES_API_KEY_REQUIRED_MESSAGE);
  }
  const data = await privilegedExtensionFetchJson(lakesAllBuoyDataApiUrl(), signal, {
    headers: lakesBearerAuthorizationHeader(trimmed),
  });
  return parseAllLakesBuoysPayload(data, temperatureUnit);
}
