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

export function mapKingCountyRowsToBuoyEntries(
  rows: IKingCountyLakeBuoyRow[],
  temperatureUnit: TWeatherTemperatureUnit,
): ILakesBuoyEntry[] {
  const seenIds = new Set<string>();
  const buoys: ILakesBuoyEntry[] = [];

  for (const row of rows) {
    const snapshot = snapshotFromKingCountyRow(row, temperatureUnit);
    if (!snapshot) continue;

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

  if (buoys.length === 0 && !rows.some((row) => row.active)) {
    throw new Error(LAKES_BUOY_NO_ACTIVE_DATA_ERROR);
  }

  return buoys;
}

export async function fetchAllLakesBuoys(
  temperatureUnit: TWeatherTemperatureUnit,
  signal?: AbortSignal,
): Promise<ILakesBuoyEntry[]> {
  const text = await privilegedExtensionFetchText(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL, signal);
  const rows = parseKingCountyLakeBuoyMapData(text);
  return mapKingCountyRowsToBuoyEntries(rows, temperatureUnit);
}
