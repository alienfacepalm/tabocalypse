import browser from "webextension-polyfill";
import type { TCryptoChartDays } from "../crypto/crypto-chart-days";
import type { ICryptoMarketRow } from "../crypto/crypto-market-row";
import type { IFetchCryptoMarketRowResult } from "../crypto/fetch-crypto-market";
import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import { stockRowFromYahooChartPayload, yahooChartUrl } from "./stock-yahoo-chart";
import {
  MIN_STOCK_SEARCH_QUERY_LENGTH,
  parseYahooSearchPayload,
  yahooSearchUrl,
  type IStockSearchHit,
} from "./stock-yahoo-search";

const CACHE_STORAGE_KEY = "tabocalypseStockYahooCacheV1";
/** New tabs open constantly; do not re-hit Yahoo's unofficial endpoint inside this window. */
const CACHE_FRESH_MS = 120_000;
const MAX_CACHE_ENTRIES = 48;

interface IStockCacheEntry {
  row: ICryptoMarketRow;
  fetchedAt: number;
}

type TStockCache = Record<string, IStockCacheEntry>;

async function loadCache(): Promise<TStockCache> {
  try {
    const r = await browser.storage.local.get(CACHE_STORAGE_KEY);
    const raw = r[CACHE_STORAGE_KEY];
    return raw && typeof raw === "object" ? (raw as TStockCache) : {};
  } catch {
    return {};
  }
}

async function saveCacheEntry(key: string, entry: IStockCacheEntry): Promise<void> {
  try {
    const cache = { ...(await loadCache()), [key]: entry };
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      keys.sort((a, b) => cache[a]!.fetchedAt - cache[b]!.fetchedAt);
      for (const stale of keys.slice(0, keys.length - MAX_CACHE_ENTRIES)) delete cache[stale];
    }
    await browser.storage.local.set({ [CACHE_STORAGE_KEY]: cache });
  } catch {
    // Cache is best-effort; live prices still render.
  }
}

export async function fetchStockMarketRow(
  symbol: string,
  days: TCryptoChartDays,
): Promise<IFetchCryptoMarketRowResult> {
  const key = `${symbol}:${days}`;
  const hit = (await loadCache())[key];
  if (hit && Date.now() - hit.fetchedAt < CACHE_FRESH_MS) {
    return { row: hit.row, stale: false };
  }
  try {
    const raw = await privilegedExtensionFetchJson(yahooChartUrl(symbol, days));
    const row = stockRowFromYahooChartPayload(raw, symbol, days);
    await saveCacheEntry(key, { row, fetchedAt: Date.now() });
    return { row, stale: false };
  } catch (error: unknown) {
    if (hit) return { row: hit.row, stale: true };
    // Yahoo answers unknown symbols with HTTP 404.
    if (error instanceof Error && error.message === "HTTP 404") {
      throw new Error("Unknown ticker");
    }
    throw error;
  }
}

export async function fetchStockSearchHits(
  query: string,
  signal?: AbortSignal,
): Promise<IStockSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_STOCK_SEARCH_QUERY_LENGTH) return [];
  if (signal?.aborted) return [];
  const raw = await privilegedExtensionFetchJson(yahooSearchUrl(trimmed), signal);
  if (signal?.aborted) return [];
  return parseYahooSearchPayload(raw);
}
