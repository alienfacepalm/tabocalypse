import { normalizeStockSymbol } from "./stock-watchlist";
import { YAHOO_FINANCE_HOST } from "./stock-yahoo-chart";

export const MIN_STOCK_SEARCH_QUERY_LENGTH = 1;
export const STOCK_SEARCH_DEBOUNCE_MS = 300;

export interface IStockSearchHit {
  symbol: string;
  name: string;
  /** Exchange + instrument kind, e.g. `NASDAQ · Equity`. */
  detail?: string;
}

/** Instrument kinds the chart endpoint prices sensibly; skips options and crypto pairs. */
const STOCK_SEARCH_QUOTE_TYPE_LABELS: Readonly<Record<string, string>> = {
  EQUITY: "Equity",
  ETF: "ETF",
  INDEX: "Index",
  MUTUALFUND: "Mutual fund",
  FUTURE: "Future",
  CURRENCY: "Currency",
};

export function yahooSearchUrl(query: string): string {
  return `https://${YAHOO_FINANCE_HOST}/v1/finance/search?q=${encodeURIComponent(query.trim())}&quotesCount=10&newsCount=0`;
}

/** Parse Yahoo Finance `/v1/finance/search` JSON into display-ready hits. */
export function parseYahooSearchPayload(raw: unknown, limit = 8): IStockSearchHit[] {
  if (!raw || typeof raw !== "object") return [];
  const quotes = (raw as { quotes?: unknown }).quotes;
  if (!Array.isArray(quotes)) return [];
  const out: IStockSearchHit[] = [];
  for (const row of quotes) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const quoteType = typeof r.quoteType === "string" ? r.quoteType.toUpperCase() : "";
    const kind = STOCK_SEARCH_QUOTE_TYPE_LABELS[quoteType];
    if (!kind) continue;
    const symbol = normalizeStockSymbol(r.symbol);
    if (!symbol) continue;
    const rawName = typeof r.shortname === "string" ? r.shortname : r.longname;
    const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : symbol;
    const exchange = typeof r.exchDisp === "string" ? r.exchDisp.trim() : "";
    const detail = [exchange, kind].filter(Boolean).join(" · ");
    out.push({ symbol, name, detail });
    if (out.length >= limit) break;
  }
  return out;
}
