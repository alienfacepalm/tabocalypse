import browser from "webextension-polyfill";
import type { INewsFeedSnapshot } from "./balanced-news-types";

const CACHE_STORAGE_KEY = "tabocalypseBalancedNewsCacheV1";
const RL_STORAGE_KEY = "tabocalypseBalancedNewsRlV1";

/** Minimum gap between network refreshes (respects FQN free-tier limits). */
export const BALANCED_NEWS_MIN_REFRESH_MS = 20 * 60 * 1000;
/** Serve cached snapshot without refetch while younger than this. */
export const BALANCED_NEWS_CACHE_FRESH_MS = 25 * 60 * 1000;
const DEFAULT_429_BACKOFF_MS = 60 * 60 * 1000;

interface ICacheEntry {
  snapshot: INewsFeedSnapshot;
  fetchedAt: number;
}

interface ICacheState {
  entries: Record<string, ICacheEntry>;
}

interface IRlState {
  nextAllowedAt: number;
  backoffUntil: number;
}

function cacheKey(country: string, category: string): string {
  return `${country}:${category}`;
}

async function loadState(): Promise<{ cache: ICacheState; rl: IRlState }> {
  const r = await browser.storage.local.get([CACHE_STORAGE_KEY, RL_STORAGE_KEY]);
  const rawCache = r[CACHE_STORAGE_KEY] as ICacheState | undefined;
  const entries =
    rawCache &&
    typeof rawCache === "object" &&
    rawCache.entries &&
    typeof rawCache.entries === "object"
      ? rawCache.entries
      : {};
  const cache: ICacheState = { entries };
  const rawRl = r[RL_STORAGE_KEY] as IRlState | undefined;
  const rl: IRlState = {
    nextAllowedAt:
      typeof rawRl?.nextAllowedAt === "number" && Number.isFinite(rawRl.nextAllowedAt)
        ? rawRl.nextAllowedAt
        : 0,
    backoffUntil:
      typeof rawRl?.backoffUntil === "number" && Number.isFinite(rawRl.backoffUntil)
        ? rawRl.backoffUntil
        : 0,
  };
  return { cache, rl };
}

async function persistState(cache: ICacheState, rl: IRlState): Promise<void> {
  await browser.storage.local.set({ [CACHE_STORAGE_KEY]: cache, [RL_STORAGE_KEY]: rl });
}

export function isBalancedNewsRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("http 429") || lower.includes("rate limit");
}

export interface IReadBalancedNewsCacheResult {
  snapshot: INewsFeedSnapshot | null;
  canRefresh: boolean;
  staleOnly: boolean;
}

export async function readBalancedNewsCache(
  country: string,
  category: string,
  now: number = Date.now(),
): Promise<IReadBalancedNewsCacheResult> {
  const { cache, rl } = await loadState();
  const key = cacheKey(country, category);
  const entry = cache.entries[key];
  const canRefresh = now >= rl.nextAllowedAt && now >= rl.backoffUntil;
  if (!entry) {
    return { snapshot: null, canRefresh, staleOnly: false };
  }
  const age = now - entry.fetchedAt;
  const fresh = age <= BALANCED_NEWS_CACHE_FRESH_MS;
  return {
    snapshot: { ...entry.snapshot, stale: !fresh },
    canRefresh,
    staleOnly: !fresh && canRefresh,
  };
}

export async function writeBalancedNewsCache(
  country: string,
  category: string,
  snapshot: INewsFeedSnapshot,
  now: number = Date.now(),
): Promise<void> {
  const { cache, rl } = await loadState();
  const key = cacheKey(country, category);
  cache.entries[key] = { snapshot: { ...snapshot, stale: false }, fetchedAt: now };
  rl.nextAllowedAt = now + BALANCED_NEWS_MIN_REFRESH_MS;
  await persistState(cache, rl);
}

export async function recordBalancedNewsRateLimit(now: number = Date.now()): Promise<void> {
  const { cache, rl } = await loadState();
  rl.backoffUntil = now + DEFAULT_429_BACKOFF_MS;
  rl.nextAllowedAt = Math.max(rl.nextAllowedAt, rl.backoffUntil);
  await persistState(cache, rl);
}

export async function markBalancedNewsManualRefresh(now: number = Date.now()): Promise<void> {
  const { cache, rl } = await loadState();
  rl.nextAllowedAt = now + BALANCED_NEWS_MIN_REFRESH_MS;
  await persistState(cache, rl);
}
