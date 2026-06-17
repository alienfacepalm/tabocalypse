import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import {
  coinGeckoSearchUrl,
  MIN_CRYPTO_SEARCH_QUERY_LENGTH,
  parseCoinGeckoSearchPayload,
  type ICryptoSearchHit,
} from "./crypto-coingecko-search";

export {
  CRYPTO_SEARCH_DEBOUNCE_MS,
  MIN_CRYPTO_SEARCH_QUERY_LENGTH,
  type ICryptoSearchHit,
} from "./crypto-coingecko-search";

export async function fetchCryptoSearchHits(
  query: string,
  signal?: AbortSignal,
): Promise<ICryptoSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_CRYPTO_SEARCH_QUERY_LENGTH) return [];
  if (signal?.aborted) return [];
  const raw = await privilegedExtensionFetchJson(coinGeckoSearchUrl(trimmed), signal);
  if (signal?.aborted) return [];
  return parseCoinGeckoSearchPayload(raw);
}
