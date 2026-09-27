import type { TCryptoChartDays } from "../crypto/crypto-chart-days";
import { marketRowFromCloses, type ICryptoMarketRow } from "../crypto/crypto-market-row";

export const YAHOO_FINANCE_HOST = "query1.finance.yahoo.com";

/** Yahoo has no 7-day range; `5d` is one trading week, which is what "7D" means for equities. */
function yahooRangeParams(days: TCryptoChartDays): { range: string; interval: string } {
  switch (days) {
    case 1:
      return { range: "1d", interval: "5m" };
    case 7:
      return { range: "5d", interval: "30m" };
    case 30:
      return { range: "1mo", interval: "1h" };
    case 90:
      return { range: "3mo", interval: "1d" };
    case 365:
      return { range: "1y", interval: "1d" };
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

export function yahooChartUrl(symbol: string, days: TCryptoChartDays): string {
  const { range, interval } = yahooRangeParams(days);
  return `https://${YAHOO_FINANCE_HOST}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
}

function finiteNumber(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/** Builds a widget row from Yahoo Finance `v8/finance/chart` JSON. */
export function stockRowFromYahooChartPayload(
  raw: unknown,
  symbol: string,
  days: TCryptoChartDays,
): ICryptoMarketRow {
  const chart = (raw as { chart?: { result?: unknown; error?: unknown } } | null)?.chart;
  const result = Array.isArray(chart?.result) ? (chart.result[0] as unknown) : null;
  if (!result || typeof result !== "object") {
    const description = (chart?.error as { description?: unknown } | null)?.description;
    throw new Error(typeof description === "string" ? description : "Unknown ticker");
  }

  const meta = (result as { meta?: Record<string, unknown> }).meta ?? {};
  const quote = (result as { indicators?: { quote?: unknown } }).indicators?.quote;
  const rawCloses = Array.isArray(quote) ? (quote[0] as { close?: unknown } | null)?.close : null;
  const closes: number[] = [];
  if (Array.isArray(rawCloses)) {
    // Yahoo pads halted / missing bars with null.
    for (const c of rawCloses) {
      const n = finiteNumber(c);
      if (n !== null) closes.push(n);
    }
  }

  const livePrice = finiteNumber(meta.regularMarketPrice);
  if (livePrice !== null) closes.push(livePrice);

  const row = marketRowFromCloses(closes, symbol);
  if (!row) throw new Error("No price data for this ticker");

  // Intraday view: match the "day change" every brokerage shows (vs previous close).
  const previousClose = finiteNumber(meta.chartPreviousClose);
  const changePct =
    days === 1 && previousClose !== null && previousClose !== 0
      ? ((row.lastPriceUsd - previousClose) / previousClose) * 100
      : row.changePct;

  // Kept verbatim: Yahoo uses sub-units like `GBp` (pence) that must not be read as `GBP`.
  const currency = typeof meta.currency === "string" ? meta.currency.trim().slice(0, 8) : "USD";
  return {
    ...row,
    changePct,
    ...(currency && currency !== "USD" ? { currency } : {}),
  };
}
