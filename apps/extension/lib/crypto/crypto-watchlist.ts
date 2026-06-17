import {
  CRYPTO_DEFAULT_ICON_URLS,
  normalizeCryptoCoinIconUrl,
  withResolvedCryptoCoinIcon,
} from "./crypto-coin-icon-url";

export interface ICryptoWatchlistEntry {
  /** CoinGecko coin id (e.g. `bitcoin`). */
  coinId: string;
  /** Short ticker shown in the panel (e.g. `BTC`). */
  symbol: string;
  /** CoinGecko CDN thumb URL (`assets.coingecko.com`). */
  iconUrl?: string;
}

export const MAX_CRYPTO_WATCHLIST = 8;

export const DEFAULT_CRYPTO_WATCHLIST: readonly ICryptoWatchlistEntry[] = [
  { coinId: "bitcoin", symbol: "BTC", iconUrl: CRYPTO_DEFAULT_ICON_URLS.bitcoin },
  { coinId: "ethereum", symbol: "ETH", iconUrl: CRYPTO_DEFAULT_ICON_URLS.ethereum },
];

const COIN_ID_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SYMBOL_RE = /^[A-Z0-9]{1,12}$/;

function normalizeSymbol(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toUpperCase();
  if (!SYMBOL_RE.test(s)) return null;
  return s;
}

function normalizeCoinId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (!s || !COIN_ID_RE.test(s)) return null;
  return s;
}

export function normalizeCryptoWatchlistEntry(raw: unknown): ICryptoWatchlistEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const coinId = normalizeCoinId((raw as { coinId?: unknown }).coinId);
  const symbol = normalizeSymbol((raw as { symbol?: unknown }).symbol);
  const iconUrl = normalizeCryptoCoinIconUrl((raw as { iconUrl?: unknown }).iconUrl);
  if (!coinId || !symbol) return null;
  return iconUrl ? { coinId, symbol, iconUrl } : { coinId, symbol };
}

export function coerceCryptoWatchlist(
  raw: unknown,
  fallback: readonly ICryptoWatchlistEntry[] = DEFAULT_CRYPTO_WATCHLIST,
): ICryptoWatchlistEntry[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out: ICryptoWatchlistEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const entry = normalizeCryptoWatchlistEntry(item);
    if (!entry || seen.has(entry.coinId)) continue;
    seen.add(entry.coinId);
    out.push(withResolvedCryptoCoinIcon(entry));
    if (out.length >= MAX_CRYPTO_WATCHLIST) break;
  }
  return out.length > 0 ? out : [...fallback];
}

export function cryptoWatchlistCoinIds(watchlist: readonly ICryptoWatchlistEntry[]): string[] {
  return watchlist.map((e) => e.coinId);
}

export function canRemoveCryptoWatchlistEntry(
  watchlist: readonly ICryptoWatchlistEntry[],
): boolean {
  return watchlist.length > 1;
}
