import type { TCryptoChartDays } from "./crypto-chart-days";

export type TCryptoTicker = string;

export type TCryptoCoinId = string;

export interface ICryptoMarketRow {
  ticker: TCryptoTicker;
  /** Display series (downsampled). */
  prices: readonly number[];
  /** Window change: first → last sample in the raw series, as a percent. */
  changePct: number;
  lastPriceUsd: number;
}

const MAX_SPARK_POINTS = 72;

function downsampleClose(points: readonly number[], maxPoints: number): number[] {
  if (points.length <= maxPoints) return [...points];
  const out: number[] = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    out.push(points[Math.min(idx, points.length - 1)]!);
  }
  return out;
}

function percentChangeFirstLast(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const first = values[0]!;
  const last = values[values.length - 1]!;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return 0;
  return ((last - first) / first) * 100;
}

function parsePriceSeries(raw: unknown): number[] {
  if (!raw || typeof raw !== "object") return [];
  const prices = (raw as { prices?: unknown }).prices;
  if (!Array.isArray(prices)) return [];
  const out: number[] = [];
  for (const row of prices) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const y = row[1];
    if (typeof y === "number" && Number.isFinite(y)) out.push(y);
  }
  return out;
}

export function coinMarketChartUrl(coinId: TCryptoCoinId, days: TCryptoChartDays): string {
  return `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
}

/** Builds a widget row from CoinGecko `market_chart` JSON. */
export function marketRowFromChartPayload(raw: unknown, ticker: TCryptoTicker): ICryptoMarketRow {
  const closes = parsePriceSeries(raw);
  if (closes.length < 2) {
    throw new Error("Unexpected crypto chart payload");
  }
  const changePct = percentChangeFirstLast(closes);
  const lastPriceUsd = closes[closes.length - 1]!;
  const prices = downsampleClose(closes, MAX_SPARK_POINTS);
  return { ticker, prices, changePct, lastPriceUsd };
}
