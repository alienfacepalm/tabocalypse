export const MIN_CRYPTO_SEARCH_QUERY_LENGTH = 2;
export const CRYPTO_SEARCH_DEBOUNCE_MS = 300;

export interface ICryptoSearchHit {
  coinId: string;
  symbol: string;
  name: string;
  iconUrl?: string;
}

import { normalizeCryptoCoinIconUrl } from "./crypto-coin-icon-url";

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
    const thumb = normalizeCryptoCoinIconUrl((row as { thumb?: unknown }).thumb);
    if (typeof id !== "string" || !id.trim()) continue;
    if (typeof symbol !== "string" || !symbol.trim()) continue;
    if (typeof name !== "string" || !name.trim()) continue;
    out.push({
      coinId: id.trim().toLowerCase(),
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      ...(thumb ? { iconUrl: thumb } : {}),
    });
    if (out.length >= limit) break;
  }
  return out;
}
