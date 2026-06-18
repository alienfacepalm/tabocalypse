import type { ICryptoWatchlistEntry } from "./crypto-watchlist";

/** Stable CoinGecko CDN thumbs for default watchlist coins and legacy entries. */
export const CRYPTO_DEFAULT_ICON_URLS: Readonly<Record<string, string>> = {
  bitcoin: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ethereum: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
};

const COINGECKO_COIN_ICON_HOSTS = new Set(["assets.coingecko.com", "coin-images.coingecko.com"]);

export function isAllowedCryptoCoinIconUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && COINGECKO_COIN_ICON_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

export function normalizeCryptoCoinIconUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed || !isAllowedCryptoCoinIconUrl(trimmed)) return undefined;
  return trimmed;
}

export function resolveCryptoCoinIconUrl(
  entry: Pick<ICryptoWatchlistEntry, "coinId" | "iconUrl">,
): string | null {
  if (entry.iconUrl) return entry.iconUrl;
  return CRYPTO_DEFAULT_ICON_URLS[entry.coinId] ?? null;
}

export function withResolvedCryptoCoinIcon(entry: ICryptoWatchlistEntry): ICryptoWatchlistEntry {
  if (entry.iconUrl) return entry;
  const fallback = CRYPTO_DEFAULT_ICON_URLS[entry.coinId];
  return fallback ? { ...entry, iconUrl: fallback } : entry;
}
