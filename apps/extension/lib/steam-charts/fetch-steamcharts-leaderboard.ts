import { privilegedExtensionFetchText } from "../privileged-extension-fetch";
import {
  parseSteamChartsAppSummary,
  parseSteamChartsTopGames,
  parseSteamChartsTopRecords,
  type ISteamChartsAppSummary,
  type ISteamChartsTopGameRow,
} from "./parse-steamcharts";

export type TSteamChartsLeaderboardKind =
  | "globalNow"
  | "globalPeak24h"
  | "globalPeakAllTime"
  | "globalTrendingUp"
  | "favoritesNow"
  | "favoritesPeak24h"
  | "favoritesPeakAllTime";

export interface ISteamChartsLeaderboardEntry {
  rank: number;
  appId: number;
  name: string;
  value: number;
}

export interface ISteamChartsLeaderboardResult {
  kind: TSteamChartsLeaderboardKind;
  updatedAtIso: string | null;
  entries: ISteamChartsLeaderboardEntry[];
}

const CACHE_TTL_MS = 15 * 60_000;

type TCacheRow = { expiresAt: number; value: unknown };
const memCache = new Map<string, TCacheRow>();

function cacheGet<T>(key: string): T | null {
  const row = memCache.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return row.value as T;
}

function cacheSet(key: string, value: unknown): void {
  memCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

function byValueDesc(a: ISteamChartsLeaderboardEntry, b: ISteamChartsLeaderboardEntry): number {
  return b.value - a.value;
}

function toEntries(
  rows: readonly ISteamChartsTopGameRow[],
  valueKey: "currentPlayers" | "peakPlayers",
  max: number,
): ISteamChartsLeaderboardEntry[] {
  const out: ISteamChartsLeaderboardEntry[] = [];
  for (const row of rows) {
    const value = row[valueKey];
    if (value == null) continue;
    out.push({ rank: out.length + 1, appId: row.appId, name: row.name, value });
    if (out.length >= max) break;
  }
  return out;
}

function computeTrendingUp(
  rows: readonly ISteamChartsTopGameRow[],
  max: number,
): ISteamChartsLeaderboardEntry[] {
  const scored: ISteamChartsLeaderboardEntry[] = [];
  for (const row of rows) {
    if (row.currentPlayers == null || row.peakPlayers == null) continue;
    if (row.peakPlayers <= 0) continue;
    const ratio = row.currentPlayers / row.peakPlayers;
    const value = Math.round(ratio * 10_000);
    scored.push({ rank: 0, appId: row.appId, name: row.name, value });
  }
  scored.sort(byValueDesc);
  return scored.slice(0, max).map((e, i) => ({ ...e, rank: i + 1 }));
}

async function loadTopGames(): Promise<ISteamChartsTopGameRow[]> {
  const key = "steamcharts:top";
  const cached = cacheGet<ISteamChartsTopGameRow[]>(key);
  if (cached) return cached;
  const html = await privilegedExtensionFetchText("https://steamcharts.com/top");
  const rows = parseSteamChartsTopGames(html);
  cacheSet(key, rows);
  return rows;
}

async function loadTopRecords(): Promise<ReturnType<typeof parseSteamChartsTopRecords>> {
  const key = "steamcharts:toppeaks";
  const cached = cacheGet<ReturnType<typeof parseSteamChartsTopRecords>>(key);
  if (cached) return cached;
  const html = await privilegedExtensionFetchText("https://steamcharts.com/");
  const rows = parseSteamChartsTopRecords(html);
  cacheSet(key, rows);
  return rows;
}

async function loadAppSummary(appId: number): Promise<ISteamChartsAppSummary | null> {
  const key = `steamcharts:app:${appId}`;
  const cached = cacheGet<ISteamChartsAppSummary | null>(key);
  if (cached !== null) return cached;
  const html = await privilegedExtensionFetchText(`https://steamcharts.com/app/${appId}`);
  const parsed = parseSteamChartsAppSummary(html, appId);
  cacheSet(key, parsed);
  return parsed;
}

async function loadFavoritesSummaries(
  appIds: readonly number[],
): Promise<ISteamChartsAppSummary[]> {
  const out: ISteamChartsAppSummary[] = [];
  for (const id of appIds) {
    const s = await loadAppSummary(id);
    if (s) out.push(s);
  }
  return out;
}

export async function fetchSteamChartsLeaderboard(input: {
  kind: TSteamChartsLeaderboardKind;
  maxRows: number;
  favoriteAppIds: readonly number[];
}): Promise<ISteamChartsLeaderboardResult> {
  const maxRows = Math.max(1, Math.min(50, Math.floor(input.maxRows)));
  const favoriteAppIds = input.favoriteAppIds
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 200);

  if (input.kind === "globalNow") {
    const rows = await loadTopGames();
    return {
      kind: input.kind,
      updatedAtIso: null,
      entries: toEntries(rows, "currentPlayers", maxRows),
    };
  }

  if (input.kind === "globalPeak24h") {
    const rows = await loadTopGames();
    return {
      kind: input.kind,
      updatedAtIso: null,
      entries: toEntries(rows, "peakPlayers", maxRows),
    };
  }

  if (input.kind === "globalPeakAllTime") {
    const rows = await loadTopRecords();
    const entries: ISteamChartsLeaderboardEntry[] = [];
    for (const row of rows) {
      if (row.peakAllTime == null) continue;
      entries.push({
        rank: entries.length + 1,
        appId: row.appId,
        name: row.name,
        value: row.peakAllTime,
      });
      if (entries.length >= maxRows) break;
    }
    return { kind: input.kind, updatedAtIso: null, entries };
  }

  if (input.kind === "globalTrendingUp") {
    const rows = await loadTopGames();
    return { kind: input.kind, updatedAtIso: null, entries: computeTrendingUp(rows, maxRows) };
  }

  const summaries = await loadFavoritesSummaries(favoriteAppIds);
  const updatedAtIso = summaries[0]?.updatedAtIso ?? null;

  const build = (
    valueOf: (s: ISteamChartsAppSummary) => number | null,
  ): ISteamChartsLeaderboardEntry[] => {
    const entries: ISteamChartsLeaderboardEntry[] = [];
    for (const s of summaries) {
      const value = valueOf(s);
      if (value == null) continue;
      entries.push({ rank: 0, appId: s.appId, name: s.name, value });
    }
    entries.sort(byValueDesc);
    return entries.slice(0, maxRows).map((e, i) => ({ ...e, rank: i + 1 }));
  };

  if (input.kind === "favoritesNow") {
    return { kind: input.kind, updatedAtIso, entries: build((s) => s.playingNow) };
  }
  if (input.kind === "favoritesPeak24h") {
    return { kind: input.kind, updatedAtIso, entries: build((s) => s.peak24h) };
  }
  return { kind: input.kind, updatedAtIso, entries: build((s) => s.peakAllTime) };
}
