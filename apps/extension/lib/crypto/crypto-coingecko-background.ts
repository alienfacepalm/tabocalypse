import browser from "webextension-polyfill";
import type { TCryptoChartDays } from "./crypto-chart-days";
import {
  coinMarketChartUrl,
  marketRowFromChartPayload,
  type ICryptoMarketRow,
  type TCryptoCoinId,
} from "./crypto-market-row";
import { parseRetryAfterDelayMs } from "./crypto-coingecko-retry-after";
import type {
  TCryptoCoingeckoMarketRowRequest,
  TCryptoCoingeckoMarketRowResponse,
} from "./crypto-coingecko-message";

const CACHE_STORAGE_KEY = "tabocalypseCryptoCgCacheV1";
const RL_STORAGE_KEY = "tabocalypseCryptoCgRlV1";

/** Space CoinGecko calls so rapid tab refreshes do not burst the demo limit. */
const MIN_REQUEST_INTERVAL_MS = 12_000;
/** Serve cache without hitting the network while data is still fresh enough. */
const CACHE_FRESH_MS = 120_000;
const DEFAULT_429_BACKOFF_MS = 60_000;
const MAX_BACKOFF_MS = 300_000;

interface ICacheEntry {
  row: ICryptoMarketRow;
  fetchedAt: number;
}

interface ICacheState {
  entries: Record<string, ICacheEntry>;
}

interface IRlState {
  nextAllowedAt: number;
  backoffUntil: number;
}

function cacheKey(coinId: TCryptoCoinId, days: TCryptoChartDays): string {
  return `${coinId}:${days}`;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let queueTail: Promise<void> = Promise.resolve();

function enqueueCryptoCoingeckoTask<T>(task: () => Promise<T>): Promise<T> {
  const next = queueTail.then(() => task());
  queueTail = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function clampBackoff(ms: number): number {
  return Math.min(Math.max(ms, 0), MAX_BACKOFF_MS);
}

async function runCryptoCoingeckoMarketRow(
  req: TCryptoCoingeckoMarketRowRequest,
): Promise<TCryptoCoingeckoMarketRowResponse> {
  const { coinId, ticker, days } = req;
  const key = cacheKey(coinId, days);
  const now = Date.now();
  const { cache, rl } = await loadState();
  const hit = cache.entries[key];
  const gate = Math.max(rl.backoffUntil, rl.nextAllowedAt);

  if (hit) {
    const age = now - hit.fetchedAt;
    if (age < CACHE_FRESH_MS) {
      return { ok: true, row: hit.row, stale: false };
    }
    if (now < gate) {
      return { ok: true, row: hit.row, stale: true };
    }
  }

  if (!hit && now < rl.backoffUntil) {
    return {
      ok: false,
      error: "CoinGecko rate limit — try again shortly.",
    };
  }

  if (!hit && now < rl.nextAllowedAt) {
    await sleep(rl.nextAllowedAt - now);
  }

  const url = coinMarketChartUrl(coinId, days);
  const tReq = Date.now();
  rl.nextAllowedAt = tReq + MIN_REQUEST_INTERVAL_MS;

  let res: Response;
  try {
    res = await fetch(url, { credentials: "omit", cache: "no-store" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (hit) {
      await persistState(cache, rl);
      return { ok: true, row: hit.row, stale: true };
    }
    await persistState(cache, rl);
    return { ok: false, error: msg };
  }

  if (res.status === 429) {
    const retryMs =
      parseRetryAfterDelayMs(res.headers.get("retry-after")) ?? DEFAULT_429_BACKOFF_MS;
    rl.backoffUntil = Date.now() + clampBackoff(retryMs);
    if (hit) {
      await persistState(cache, rl);
      return { ok: true, row: hit.row, stale: true };
    }
    await persistState(cache, rl);
    return { ok: false, error: "CoinGecko rate limit — try again shortly." };
  }

  if (!res.ok) {
    if (hit) {
      await persistState(cache, rl);
      return { ok: true, row: hit.row, stale: true };
    }
    await persistState(cache, rl);
    return { ok: false, error: `HTTP ${res.status}` };
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    if (hit) {
      await persistState(cache, rl);
      return { ok: true, row: hit.row, stale: true };
    }
    await persistState(cache, rl);
    return { ok: false, error: "Invalid crypto chart response" };
  }

  let row: ICryptoMarketRow;
  try {
    row = marketRowFromChartPayload(raw, ticker);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected crypto chart payload";
    if (hit) {
      await persistState(cache, rl);
      return { ok: true, row: hit.row, stale: true };
    }
    await persistState(cache, rl);
    return { ok: false, error: msg };
  }

  rl.backoffUntil = 0;
  cache.entries[key] = { row, fetchedAt: Date.now() };
  await persistState(cache, rl);
  return { ok: true, row, stale: false };
}

export function handleCryptoCoingeckoMarketRowRequest(
  req: TCryptoCoingeckoMarketRowRequest,
): Promise<TCryptoCoingeckoMarketRowResponse> {
  return enqueueCryptoCoingeckoTask(() => runCryptoCoingeckoMarketRow(req));
}
