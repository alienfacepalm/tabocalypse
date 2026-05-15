import type { TCryptoChartDays } from "./crypto-chart-days";
import type { ICryptoMarketRow, TCryptoCoinId, TCryptoTicker } from "./crypto-market-row";

export const TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW =
  "tabocalypse/cryptoCoingeckoMarketRow" as const;

export type TCryptoCoingeckoMarketRowRequest = {
  type: typeof TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW;
  coinId: TCryptoCoinId;
  ticker: TCryptoTicker;
  days: TCryptoChartDays;
};

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
