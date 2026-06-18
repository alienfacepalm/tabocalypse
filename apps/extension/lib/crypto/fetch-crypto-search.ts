import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import {
  coinGeckoSearchUrl,
  MIN_CRYPTO_SEARCH_QUERY_LENGTH,
  parseCoinGeckoSearchPayload,
  type ICryptoSearchHit,
} from "./crypto-coingecko-search";
import { fetchCryptoWatchlistIconUrls } from "./fetch-crypto-watchlist-icons";

export {
  CRYPTO_SEARCH_DEBOUNCE_MS,
  MIN_CRYPTO_SEARCH_QUERY_LENGTH,
  type ICryptoSearchHit,
} from "./crypto-coingecko-search";

async function enrichCryptoSearchHitIcons(
  hits: ICryptoSearchHit[],
  signal?: AbortSignal,
): Promise<ICryptoSearchHit[]> {
  const missingIds = hits.filter((hit) => !hit.iconUrl).map((hit) => hit.coinId);
  if (missingIds.length === 0) return hits;
  const icons = await fetchCryptoWatchlistIconUrls(missingIds, signal);
  if (signal?.aborted) return hits;
  return hits.map((hit) => {
    const iconUrl = hit.iconUrl ?? icons[hit.coinId];
    return iconUrl ? { ...hit, iconUrl } : hit;
  });
}

export async function fetchCryptoSearchHits(
  query: string,
  signal?: AbortSignal,
): Promise<ICryptoSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_CRYPTO_SEARCH_QUERY_LENGTH) return [];
  if (signal?.aborted) return [];
  const raw = await privilegedExtensionFetchJson(coinGeckoSearchUrl(trimmed), signal);
  if (signal?.aborted) return [];
  const hits = parseCoinGeckoSearchPayload(raw);
  if (hits.length === 0) return hits;
  try {
    return await enrichCryptoSearchHitIcons(hits, signal);
  } catch {
    return hits;
  }
}
