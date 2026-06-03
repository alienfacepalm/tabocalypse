/** King County lake buoy map feed (same format as green2.kingcounty.gov/lake-buoy map page). */
export const KING_COUNTY_LAKE_BUOY_MAP_DATA_URL =
  "https://green2.kingcounty.gov/lake-buoy/GenerateMapData.aspx";

export const KING_COUNTY_LAKE_BUOY_HOME_URL =
  "https://green2.kingcounty.gov/lake-buoy/default.aspx";

export const KING_COUNTY_LAKE_BUOY_PROVISIONAL_URL =
  "https://www.kingcounty.gov/services/environment/water-and-land/lakes/lake-buoy-data/provisional.aspx";

export interface IKingCountyLakeBuoyRow {
  name: string;
  collectDate: string | null;
  airTempC: number | null;
  windSpeedMps: number | null;
  windDirection: string | null;
  waterTempC: number | null;
  profileDate: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
}

function readField(fields: string[], index: number): string | null {
  const raw = fields[index];
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumericField(fields: string[], index: number): number | null {
  const text = readField(fields, index);
  if (text == null || text.toUpperCase() === "NA") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function splitKingCountyRecord(record: string): string[] {
  if (record.includes("|\t")) {
    return record.split("|\t").map((field) => field.trim());
  }
  return record.split("|").map((field) => field.trim());
}

/** Parses `GenerateMapData.aspx` body (`^|` records, `|\t` fields). */
export function parseKingCountyLakeBuoyMapData(text: string): IKingCountyLakeBuoyRow[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const records = trimmed.split("^|");
  const rows: IKingCountyLakeBuoyRow[] = [];

  for (const record of records) {
    if (!record.trim()) continue;
    const fields = splitKingCountyRecord(record);
    const name = readField(fields, 0);
    if (!name) continue;

    const activeRaw = readField(fields, 9);
    const active = activeRaw?.toUpperCase() === "Y";

    rows.push({
      name,
      collectDate: readField(fields, 1),
      airTempC: readNumericField(fields, 2),
      windSpeedMps: readNumericField(fields, 3),
      windDirection: readField(fields, 4),
      waterTempC: readNumericField(fields, 5),
      profileDate: readField(fields, 6),
      latitude: readNumericField(fields, 7),
      longitude: readNumericField(fields, 8),
      active,
    });
  }

  return rows;
}

/** Matches King County map popup mph rounding. */
export function kingCountyWindMetersPerSecToMph(metersPerSec: number): number {
  return Math.round((metersPerSec * 3600) / 1609.344);
}

export function kingCountyCelsiusToFahrenheit(celsius: number): number {
  return Math.round(32 + (celsius * 9) / 5);
}

export function kingCountyLakeBuoyLocationName(name: string, active: boolean): string {
  if (active) return `Lake ${name}`;
  return name;
}
