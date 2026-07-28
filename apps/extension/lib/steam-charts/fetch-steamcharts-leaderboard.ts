import {
  privilegedExtensionFetchJson,
  privilegedExtensionFetchText,
} from "../privileged-extension-fetch";
import { parseSteamChartsTopGames } from "./parse-steamcharts";
import {
  STEAM_CHARTS_OPEN_ABSOLUTE_MAX,
  STEAM_CHARTS_TOP_PAGE_SIZE,
  steamChartsTopPageUrl,
} from "./steam-charts-virtual";

export type TSteamChartsBoardMode = "open" | "recent";

export type TSteamChartsLeaderboardSource = "open" | "recent";

export interface ISteamChartsLeaderboardEntry {
  rank: number;
  appId: number;
  name: string;
  value: number;
  /** Unix seconds of last play (Recently played / owned games); omitted for open charts. */
  lastPlayedAtSec?: number | null;
}

interface ISteamChartsLeaderboardResult {
  source: TSteamChartsLeaderboardSource;
  /** Short label for the value column (e.g. players now, hours). */
  valueLabel: string;
  entries: ISteamChartsLeaderboardEntry[];
  /** True when more open-chart pages may exist (ignored for recent). */
  hasMore?: boolean;
  /** 1-based next page to request for open charts when hasMore. */
  nextPage?: number;
}

const CACHE_TTL_MS = 15 * 60_000;
const DEFAULT_MAX_ROWS = 10;

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

function clampMaxRows(raw: number | undefined): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return DEFAULT_MAX_ROWS;
  return Math.max(1, Math.min(STEAM_CHARTS_OPEN_ABSOLUTE_MAX, Math.floor(raw)));
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

interface ISteamChartsOpenPageResult {
  page: number;
  entries: ISteamChartsLeaderboardEntry[];
  hasMore: boolean;
}

/** Load one steamcharts.com /top page (25 rows). Page is 1-based. */
export async function fetchSteamChartsOpenPage(page: number): Promise<ISteamChartsOpenPageResult> {
  const p = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const cacheKey = `steamcharts:top:page:${p}`;
  const cached = cacheGet<ISteamChartsOpenPageResult>(cacheKey);
  if (cached) return cached;

  const html = await privilegedExtensionFetchText(steamChartsTopPageUrl(p));
  const rows = parseSteamChartsTopGames(html);
  const entries: ISteamChartsLeaderboardEntry[] = [];
  for (const row of rows) {
    if (row.currentPlayers == null) continue;
    entries.push({
      rank: row.rank > 0 ? row.rank : (p - 1) * STEAM_CHARTS_TOP_PAGE_SIZE + entries.length + 1,
      appId: row.appId,
      name: row.name,
      value: row.currentPlayers,
    });
  }
  const result: ISteamChartsOpenPageResult = {
    page: p,
    entries,
    hasMore: entries.length >= STEAM_CHARTS_TOP_PAGE_SIZE,
  };
  cacheSet(cacheKey, result);
  return result;
}

async function loadOpenTopGamesUntil(maxRows: number): Promise<ISteamChartsLeaderboardResult> {
  const limit = clampMaxRows(maxRows);
  const entries: ISteamChartsLeaderboardEntry[] = [];
  let page = 1;
  let hasMore = true;
  while (entries.length < limit && hasMore) {
    const batch = await fetchSteamChartsOpenPage(page);
    for (const row of batch.entries) {
      if (entries.length >= limit) break;
      // Prefer sequential rank when merging pages.
      entries.push({ ...row, rank: entries.length + 1 });
    }
    hasMore = batch.hasMore;
    page += 1;
    if (batch.entries.length === 0) break;
  }
  return {
    source: "open",
    valueLabel: "Players now",
    entries,
    hasMore: hasMore && entries.length < STEAM_CHARTS_OPEN_ABSOLUTE_MAX,
    nextPage: page,
  };
}

async function resolveSteamId64(apiKey: string, steamIdOrVanity: string): Promise<string> {
  const trimmed = steamIdOrVanity.trim();
  const fromUrl = /steamcommunity\.com\/(?:id|profiles)\/([^/?#]+)/i.exec(trimmed)?.[1];
  const candidate = fromUrl ? decodeURIComponent(fromUrl) : trimmed;
  if (/^\d{17}$/.test(candidate)) return candidate;

  const url = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vanityurl", candidate);
  const data = await privilegedExtensionFetchJson(url.href);
  const response = asRecord(asRecord(data)?.response);
  const success = response?.success;
  const steamid = response?.steamid;
  if (success === 1 && typeof steamid === "string" && /^\d{17}$/.test(steamid)) {
    return steamid;
  }
  throw new Error("Could not resolve that Steam ID or profile name. Check the id and try again.");
}

/**
 * Recently played board: owned games sorted by last play time (fills tall panels),
 * with lifetime hours. Needs a public profile (or the key owner's account).
 */
async function loadRecentlyPlayedGames(
  apiKey: string,
  steamIdOrVanity: string,
  maxRows: number,
): Promise<ISteamChartsLeaderboardResult> {
  const steamid = await resolveSteamId64(apiKey, steamIdOrVanity);
  const limit = clampMaxRows(maxRows);
  const cacheKey = `steamapi:owned-lastplayed:${steamid}:${limit}`;
  const cached = cacheGet<ISteamChartsLeaderboardResult>(cacheKey);
  if (cached) return cached;

  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamid);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");
  url.searchParams.set("format", "json");

  const data = await privilegedExtensionFetchJson(url.href);
  const response = asRecord(asRecord(data)?.response);
  const games = asArray(response?.games);

  type TOwnedRow = {
    appId: number;
    name: string;
    hours: number;
    lastPlayedAtSec: number;
  };
  const parsed: TOwnedRow[] = [];
  for (const raw of games) {
    const row = asRecord(raw);
    if (!row) continue;
    const appId = typeof row.appid === "number" ? row.appid : Number(row.appid);
    if (!Number.isFinite(appId) || appId <= 0) continue;
    const playtimeForever =
      typeof row.playtime_forever === "number"
        ? row.playtime_forever
        : Number(row.playtime_forever);
    const lastPlayedRaw =
      typeof row.rtime_last_played === "number"
        ? row.rtime_last_played
        : Number(row.rtime_last_played);
    const lastPlayedAtSec =
      Number.isFinite(lastPlayedRaw) && lastPlayedRaw > 0 ? Math.floor(lastPlayedRaw) : 0;
    const minutes = Number.isFinite(playtimeForever) && playtimeForever > 0 ? playtimeForever : 0;
    // Skip never-played titles (no last play and no hours).
    if (lastPlayedAtSec <= 0 && minutes <= 0) continue;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    parsed.push({
      appId,
      name: name || `App ${appId}`,
      hours: Math.round(minutes / 60),
      lastPlayedAtSec,
    });
  }

  parsed.sort((a, b) => {
    if (b.lastPlayedAtSec !== a.lastPlayedAtSec) return b.lastPlayedAtSec - a.lastPlayedAtSec;
    return b.hours - a.hours;
  });

  const entries: ISteamChartsLeaderboardEntry[] = parsed.slice(0, limit).map((row, i) => ({
    rank: i + 1,
    appId: row.appId,
    name: row.name,
    value: row.hours,
    lastPlayedAtSec: row.lastPlayedAtSec > 0 ? row.lastPlayedAtSec : null,
  }));

  const result: ISteamChartsLeaderboardResult = {
    source: "recent",
    valueLabel: "Hours played",
    entries,
    hasMore: parsed.length > entries.length,
  };
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Steam Charts leaderboard.
 * - `open` (default) → public steamcharts.com concurrent players — works without a key.
 * - `recent` → your owned games by last play date, with lifetime hours (needs API key + Steam ID).
 */
export async function fetchSteamChartsLeaderboard(input: {
  mode?: TSteamChartsBoardMode;
  maxRows?: number;
  steamWebApiKey?: string;
  steamId?: string;
}): Promise<ISteamChartsLeaderboardResult> {
  const maxRows = clampMaxRows(input.maxRows);
  const mode: TSteamChartsBoardMode = input.mode === "recent" ? "recent" : "open";
  const apiKey = input.steamWebApiKey?.trim() ?? "";
  const steamId = input.steamId?.trim() ?? "";

  if (mode === "recent") {
    if (!apiKey) {
      throw new Error("Add a Steam Web API key under Settings > Steam® leaderboard.");
    }
    if (!steamId) {
      throw new Error(
        "Add your Steam ID (or profile name) under Settings > Steam® leaderboard to load recently played games.",
      );
    }
    return loadRecentlyPlayedGames(apiKey, steamId, maxRows);
  }

  return loadOpenTopGamesUntil(maxRows);
}
