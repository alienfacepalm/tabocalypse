export interface IStockWatchlistEntry {
  /** Yahoo Finance symbol (e.g. `AAPL`, `BRK-B`, `^GSPC`, `SHOP.TO`). */
  symbol: string;
  /** Company / fund name from search, shown as a tooltip. */
  name?: string;
}

export const MAX_STOCK_WATCHLIST = 8;

export const DEFAULT_STOCK_WATCHLIST: readonly IStockWatchlistEntry[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "AAPL", name: "Apple Inc." },
];

const STOCK_SYMBOL_RE = /^[A-Z0-9^][A-Z0-9.\-=^]{0,14}$/;
const MAX_STOCK_NAME_LENGTH = 80;

export function normalizeStockSymbol(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toUpperCase();
  return STOCK_SYMBOL_RE.test(s) ? s : null;
}

function normalizeStockName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().slice(0, MAX_STOCK_NAME_LENGTH);
  return s.length > 0 ? s : undefined;
}

export function normalizeStockWatchlistEntry(raw: unknown): IStockWatchlistEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const symbol = normalizeStockSymbol((raw as { symbol?: unknown }).symbol);
  if (!symbol) return null;
  const name = normalizeStockName((raw as { name?: unknown }).name);
  return name ? { symbol, name } : { symbol };
}

export function coerceStockWatchlist(
  raw: unknown,
  fallback: readonly IStockWatchlistEntry[] = DEFAULT_STOCK_WATCHLIST,
): IStockWatchlistEntry[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out: IStockWatchlistEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const entry = normalizeStockWatchlistEntry(item);
    if (!entry || seen.has(entry.symbol)) continue;
    seen.add(entry.symbol);
    out.push(entry);
    if (out.length >= MAX_STOCK_WATCHLIST) break;
  }
  return out.length > 0 ? out : [...fallback];
}

export function canRemoveStockWatchlistEntry(watchlist: readonly IStockWatchlistEntry[]): boolean {
  return watchlist.length > 1;
}
