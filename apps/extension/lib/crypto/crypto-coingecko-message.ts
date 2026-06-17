import { coerceCryptoChartDays, type TCryptoChartDays } from "./crypto-chart-days";
import type { ICryptoMarketRow, TCryptoCoinId, TCryptoTicker } from "./crypto-market-row";
import { normalizeCryptoWatchlistEntry } from "./crypto-watchlist";

export const TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW =
  "tabocalypse/cryptoCoingeckoMarketRow" as const;

export type TCryptoCoingeckoMarketRowRequest = {
  type: typeof TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW;
  coinId: TCryptoCoinId;
  ticker: TCryptoTicker;
  days: TCryptoChartDays;
};

/** Validates background `sendMessage` payloads for arbitrary watchlist coins. */
export function parseCryptoCoingeckoMarketRowMessage(message: {
  coinId?: unknown;
  ticker?: unknown;
  days?: unknown;
}): TCryptoCoingeckoMarketRowRequest | null {
  const entry = normalizeCryptoWatchlistEntry({
    coinId: message.coinId,
    symbol: message.ticker,
  });
  if (!entry || typeof message.days !== "number") return null;
  return {
    type: TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW,
    coinId: entry.coinId,
    ticker: entry.symbol,
    days: coerceCryptoChartDays(message.days, 7),
  };
}

export type TCryptoCoingeckoMarketRowOk = {
  ok: true;
  row: ICryptoMarketRow;
  /** True when prices come from cache (wait window, backoff, or rate limit). */
  stale: boolean;
};

export type TCryptoCoingeckoMarketRowErr = {
  ok: false;
  error: string;
};

export type TCryptoCoingeckoMarketRowResponse =
  | TCryptoCoingeckoMarketRowOk
  | TCryptoCoingeckoMarketRowErr;
