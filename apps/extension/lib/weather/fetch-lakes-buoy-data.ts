import { privilegedExtensionFetchText } from "../privileged-extension-fetch";
import type { TWeatherTemperatureUnit } from "./weather-units";
import {
  KING_COUNTY_LAKE_BUOY_MAP_DATA_URL,
  kingCountyCelsiusToFahrenheit,
  kingCountyLakeBuoyLocationName,
  kingCountyWindMetersPerSecToMph,
  parseKingCountyLakeBuoyMapData,
  type IKingCountyLakeBuoyRow,
} from "./parse-king-county-lake-buoy-map-data";

export { KING_COUNTY_LAKE_BUOY_MAP_DATA_URL } from "./parse-king-county-lake-buoy-map-data";

/** Public 2lakes Worker (D1 source of truth). Does not depend on the 2lakes.app domain. */
export const LAKES_BUOY_WORKER_API_BASE = "https://2lakes-api.brandon-pliska-86a.workers.dev";

export const LAKES_BUOY_NO_ACTIVE_DATA_ERROR = "No active buoy data returned";

export const LAKES_BUOY_STATUS_ACTIVE = "ACTIVE";
export const LAKES_BUOY_STATUS_WATER_TEMP_MISSING = "Live sensor (water temp missing)";
export const LAKES_BUOY_STATUS_WATER_TEMP_MISSING_DETAIL =
  "Water temp temporarily missing, but other data active";

export interface ILakesBuoySnapshot {
  location: string;
  waterTemp: number | null;
  airTemp: number | null;
  windSpeed: number | null;
  humidity: number | null;
  condition: string;
  status: string;
  timestamp: string;
  temperatureUnit: TWeatherTemperatureUnit;
}

export interface ILakesBuoyEntry {
  id: string;
  label: string;
  data: ILakesBuoySnapshot;
  /** Always true for King County map data (single feed includes weather + profile timestamps). */
  detailComplete: boolean;
}

/** One row from `GET /v1/latest` (subset used by the Weather widget). */
interface ILakesBuoyWorkerReading {
  buoyId: string;
  timestamp: string;
  tempC: number | null;
  airTempC: number | null;
  windSpeed: number | null;
  humidity: number | null;
}

function formatBuoyCondition(row: IKingCountyLakeBuoyRow): string {
  const parts: string[] = [];
  const windDirection = row.windDirection?.trim();
  if (windDirection && windDirection.toUpperCase() !== "NA") {
    parts.push(windDirection);
  }
  if (row.windSpeedMps != null) {
    parts.push(`${kingCountyWindMetersPerSecToMph(row.windSpeedMps)} mph`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Unknown";
}

function formatWorkerCondition(windSpeedMps: number | null): string {
  if (windSpeedMps == null) return "Unknown";
  return `${kingCountyWindMetersPerSecToMph(windSpeedMps)} mph`;
}

function temperatureFromCelsius(celsius: number, temperatureUnit: TWeatherTemperatureUnit): number {
  return temperatureUnit === "celsius" ? celsius : kingCountyCelsiusToFahrenheit(celsius);
}

function snapshotFromKingCountyRow(
  row: IKingCountyLakeBuoyRow,
  temperatureUnit: TWeatherTemperatureUnit,
): ILakesBuoySnapshot | null {
  if (!row.active) return null;

  const location = kingCountyLakeBuoyLocationName(row.name, row.active);
  const waterTemp =
    row.waterTempC == null ? null : temperatureFromCelsius(row.waterTempC, temperatureUnit);
  const airTemp =
    row.airTempC == null ? null : temperatureFromCelsius(row.airTempC, temperatureUnit);
  const windSpeed =
    row.windSpeedMps == null ? null : kingCountyWindMetersPerSecToMph(row.windSpeedMps);
  const timestamp = row.collectDate ?? row.profileDate ?? "—";
  const status =
    waterTemp != null ? LAKES_BUOY_STATUS_ACTIVE : LAKES_BUOY_STATUS_WATER_TEMP_MISSING;

  return {
    location,
    waterTemp,
    airTemp,
    windSpeed,
    humidity: null,
    condition: formatBuoyCondition(row),
    status,
    timestamp,
    temperatureUnit,
  };
}

function snapshotFromWorkerReading(
  row: ILakesBuoyWorkerReading,
  temperatureUnit: TWeatherTemperatureUnit,
): ILakesBuoySnapshot | null {
  const hasSignal = row.tempC != null || row.airTempC != null || row.windSpeed != null;
  if (!hasSignal) return null;

  const waterTemp = row.tempC == null ? null : temperatureFromCelsius(row.tempC, temperatureUnit);
  const airTemp =
    row.airTempC == null ? null : temperatureFromCelsius(row.airTempC, temperatureUnit);
  const windSpeed = row.windSpeed == null ? null : kingCountyWindMetersPerSecToMph(row.windSpeed);
  const status =
    waterTemp != null ? LAKES_BUOY_STATUS_ACTIVE : LAKES_BUOY_STATUS_WATER_TEMP_MISSING;

  return {
    location: row.buoyId,
    waterTemp,
    airTemp,
    windSpeed,
    humidity: row.humidity,
    condition: formatWorkerCondition(row.windSpeed),
    status,
    timestamp: row.timestamp || "—",
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

function entriesFromSnapshots(snapshots: ILakesBuoySnapshot[]): ILakesBuoyEntry[] {
  const seenIds = new Set<string>();
  const buoys: ILakesBuoyEntry[] = [];

  for (const snapshot of snapshots) {
    let id = lakesBuoyIdFromLocation(snapshot.location);
    if (seenIds.has(id)) {
      id = `${id}-${buoys.length + 1}`;
    }
    seenIds.add(id);

    buoys.push({
      id,
      label: lakesBuoyDisplayLabel(snapshot.location),
      data: snapshot,
      detailComplete: true,
    });
  }

  return buoys;
}

export function mapKingCountyRowsToBuoyEntries(
  rows: IKingCountyLakeBuoyRow[],
  temperatureUnit: TWeatherTemperatureUnit,
): ILakesBuoyEntry[] {
  const snapshots: ILakesBuoySnapshot[] = [];
  for (const row of rows) {
    const snapshot = snapshotFromKingCountyRow(row, temperatureUnit);
    if (snapshot) snapshots.push(snapshot);
  }

  const buoys = entriesFromSnapshots(snapshots);

  if (buoys.length === 0 && !rows.some((row) => row.active)) {
    throw new Error(LAKES_BUOY_NO_ACTIVE_DATA_ERROR);
  }

  return buoys;
}

export function mapWorkerLatestToBuoyEntries(
  rows: ILakesBuoyWorkerReading[],
  temperatureUnit: TWeatherTemperatureUnit,
): ILakesBuoyEntry[] {
  const snapshots: ILakesBuoySnapshot[] = [];
  for (const row of rows) {
    const snapshot = snapshotFromWorkerReading(row, temperatureUnit);
    if (snapshot) snapshots.push(snapshot);
  }

  const buoys = entriesFromSnapshots(snapshots);
  if (buoys.length === 0) {
    throw new Error(LAKES_BUOY_NO_ACTIVE_DATA_ERROR);
  }
  return buoys;
}

function parseWorkerLatest(text: string): ILakesBuoyWorkerReading[] {
  const body = JSON.parse(text) as { rows?: unknown };
  if (!body || !Array.isArray(body.rows)) {
    throw new Error("unexpected Worker /v1/latest shape");
  }
  const out: ILakesBuoyWorkerReading[] = [];
  for (const raw of body.rows) {
    const r = raw as Partial<ILakesBuoyWorkerReading> | null;
    if (!r || typeof r.buoyId !== "string" || typeof r.timestamp !== "string") continue;
    out.push({
      buoyId: r.buoyId,
      timestamp: r.timestamp,
      tempC: typeof r.tempC === "number" ? r.tempC : null,
      airTempC: typeof r.airTempC === "number" ? r.airTempC : null,
      windSpeed: typeof r.windSpeed === "number" ? r.windSpeed : null,
      humidity: typeof r.humidity === "number" ? r.humidity : null,
    });
  }
  return out;
}

async function fetchAllLakesBuoysFromWorker(
  temperatureUnit: TWeatherTemperatureUnit,
  signal?: AbortSignal,
): Promise<ILakesBuoyEntry[]> {
  const text = await privilegedExtensionFetchText(
    `${LAKES_BUOY_WORKER_API_BASE}/v1/latest`,
    signal,
  );
  return mapWorkerLatestToBuoyEntries(parseWorkerLatest(text), temperatureUnit);
}

async function fetchAllLakesBuoysFromKingCounty(
  temperatureUnit: TWeatherTemperatureUnit,
  signal?: AbortSignal,
): Promise<ILakesBuoyEntry[]> {
  const text = await privilegedExtensionFetchText(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL, signal);
  const rows = parseKingCountyLakeBuoyMapData(text);
  return mapKingCountyRowsToBuoyEntries(rows, temperatureUnit);
}

/**
 * Prefer the public 2lakes Worker (`/v1/latest`, D1 source of truth).
 * Fall back to King County map data if the Worker is unreachable.
 */
export async function fetchAllLakesBuoys(
  temperatureUnit: TWeatherTemperatureUnit,
  signal?: AbortSignal,
): Promise<ILakesBuoyEntry[]> {
  try {
    return await fetchAllLakesBuoysFromWorker(temperatureUnit, signal);
  } catch {
    return fetchAllLakesBuoysFromKingCounty(temperatureUnit, signal);
  }
}
