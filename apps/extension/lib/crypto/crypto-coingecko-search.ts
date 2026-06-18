export const MIN_CRYPTO_SEARCH_QUERY_LENGTH = 2;
export const CRYPTO_SEARCH_DEBOUNCE_MS = 300;

export interface ICryptoSearchHit {
  coinId: string;
  symbol: string;
  name: string;
  iconUrl?: string;
}

import { normalizeCryptoCoinIconUrl, withResolvedCryptoCoinIcon } from "./crypto-coin-icon-url";
import { normalizeCryptoWatchlistEntry } from "./crypto-watchlist";

export function coinGeckoSearchUrl(query: string): string {
  return `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query.trim())}`;
}

/** Parse CoinGecko `/search` JSON into display-ready hits. */
export function parseCoinGeckoSearchPayload(raw: unknown, limit = 8): ICryptoSearchHit[] {
  if (!raw || typeof raw !== "object") return [];
  const coins = (raw as { coins?: unknown }).coins;
  if (!Array.isArray(coins)) return [];
  const out: ICryptoSearchHit[] = [];
  for (const row of coins) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    const symbol = (row as { symbol?: unknown }).symbol;
    const name = (row as { name?: unknown }).name;
    const thumb =
      normalizeCryptoCoinIconUrl((row as { thumb?: unknown }).thumb) ??
      normalizeCryptoCoinIconUrl((row as { large?: unknown }).large);
    if (typeof id !== "string" || !id.trim()) continue;
    if (typeof symbol !== "string" || !symbol.trim()) continue;
    if (typeof name !== "string" || !name.trim()) continue;
    const normalized = normalizeCryptoWatchlistEntry({
      coinId: id,
      symbol,
      ...(thumb ? { iconUrl: thumb } : {}),
    });
    if (!normalized) continue;
    const entry = withResolvedCryptoCoinIcon(normalized);
    out.push({
      coinId: entry.coinId,
      symbol: entry.symbol,
      name: name.trim(),
      ...(entry.iconUrl ? { iconUrl: entry.iconUrl } : {}),
    });
    if (out.length >= limit) break;
  }
  return out;
}
