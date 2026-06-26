import { normalizeCryptoCoinIconUrl } from "./crypto-coin-icon-url";
import type { TCryptoCoinId } from "./crypto-market-row";

export function coinGeckoMarketsIconUrl(coinIds: readonly TCryptoCoinId[]): string | null {
  const ids = coinIds.map((id) => id.trim()).filter((id) => id.length > 0);
  if (ids.length === 0) return null;
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: ids.join(","),
    order: "market_cap_desc",
    per_page: String(Math.min(ids.length, 250)),
    page: "1",
    sparkline: "false",
  });
  return `https://api.coingecko.com/api/v3/coins/markets?${params}`;
}

/** Parse CoinGecko `/coins/markets` JSON into coin-id → logo URL map. */
export function parseCoinGeckoMarketsIconUrls(raw: unknown): Readonly<Record<string, string>> {
  if (!Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    const image = normalizeCryptoCoinIconUrl((row as { image?: unknown }).image);
    if (typeof id !== "string" || !id.trim() || !image) continue;
    out[id.trim()] = image;
  }
  return out;
}
