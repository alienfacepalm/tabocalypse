import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import { coinGeckoMarketsIconUrl, parseCoinGeckoMarketsIconUrls } from "./crypto-coingecko-markets";
import type { TCryptoCoinId } from "./crypto-market-row";

export async function fetchCryptoWatchlistIconUrls(
  coinIds: readonly TCryptoCoinId[],
  signal?: AbortSignal,
): Promise<Readonly<Record<string, string>>> {
  const url = coinGeckoMarketsIconUrl(coinIds);
  if (!url) return {};
  if (signal?.aborted) return {};
  const raw = await privilegedExtensionFetchJson(url, signal);
  if (signal?.aborted) return {};
  return parseCoinGeckoMarketsIconUrls(raw);
}
