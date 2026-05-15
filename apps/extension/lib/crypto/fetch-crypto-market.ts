import {
  extensionRuntimeSendMessage,
  privilegedExtensionFetchJson,
  useBackgroundPrivilegedFetch,
} from "../privileged-extension-fetch";
import {
  TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW,
  type TCryptoCoingeckoMarketRowResponse,
} from "./crypto-coingecko-message";
import type { TCryptoChartDays } from "./crypto-chart-days";
import {
  coinMarketChartUrl,
  marketRowFromChartPayload,
  type ICryptoMarketRow,
  type TCryptoCoinId,
  type TCryptoTicker,
} from "./crypto-market-row";

export type { ICryptoMarketRow, TCryptoTicker } from "./crypto-market-row";

export interface IFetchCryptoMarketRowResult {
  row: ICryptoMarketRow;
  /** Served from extension cache (spacing window, backoff, or HTTP error fallback). */
  stale: boolean;
}

function coerceCryptoMarketRowResponse(
  raw: unknown,
): TCryptoCoingeckoMarketRowResponse | undefined {
  if (!raw || typeof raw !== "object" || !("ok" in raw)) return undefined;
  const ok = (raw as { ok?: unknown }).ok;
  if (ok === true && "row" in raw && "stale" in raw) {
    return raw as TCryptoCoingeckoMarketRowResponse;
  }
  if (ok === false && "error" in raw && typeof (raw as { error?: unknown }).error === "string") {
    return raw as TCryptoCoingeckoMarketRowResponse;
  }
  return undefined;
}

async function fetchCoinGeckoMarketRowViaBackground(
  coinId: TCryptoCoinId,
  ticker: TCryptoTicker,
  days: TCryptoChartDays,
): Promise<IFetchCryptoMarketRowResult> {
  const rawUnknown = await extensionRuntimeSendMessage<unknown>({
    type: TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW,
    coinId,
    ticker,
    days,
  });
  const parsed = coerceCryptoMarketRowResponse(rawUnknown);
  if (!parsed) {
    throw new Error("Unexpected crypto background response");
  }
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  return { row: parsed.row, stale: parsed.stale };
}

export async function fetchCoinGeckoMarketRow(
  coinId: TCryptoCoinId,
  ticker: TCryptoTicker,
  days: TCryptoChartDays,
): Promise<IFetchCryptoMarketRowResult> {
  if (useBackgroundPrivilegedFetch()) {
    return fetchCoinGeckoMarketRowViaBackground(coinId, ticker, days);
  }

  const url = coinMarketChartUrl(coinId, days);
  const raw = await privilegedExtensionFetchJson(url);
  const row = marketRowFromChartPayload(raw, ticker);
  return { row, stale: false };
}
