import React, { useCallback, useMemo } from "react";
import { fetchStockSearchHits } from "../../lib/stocks/fetch-stock-market";
import {
  MAX_STOCK_WATCHLIST,
  normalizeStockSymbol,
  type IStockWatchlistEntry,
} from "../../lib/stocks/stock-watchlist";
import {
  MIN_STOCK_SEARCH_QUERY_LENGTH,
  STOCK_SEARCH_DEBOUNCE_MS,
  type IStockSearchHit,
} from "../../lib/stocks/stock-yahoo-search";
import { WatchlistAddField, type IWatchlistAddFieldLabels } from "./watchlist-add-field";

const STOCK_ADD_FIELD_LABELS: IWatchlistAddFieldLabels = {
  placeholder: "Add any ticker or company",
  inputAriaLabel: "Add ticker to watchlist",
  listAriaLabel: "Yahoo Finance ticker matches",
  submitAriaLabel: "Add ticker",
  submitTip: "Add the typed ticker (or highlighted match) to your watchlist",
  searching: "Searching tickers…",
  searchFailed: "Could not search tickers",
  full: `Watchlist full (${MAX_STOCK_WATCHLIST} tickers). Remove one to add another.`,
};

function stockHitId(hit: IStockSearchHit): string {
  return hit.symbol;
}

/** Any well-formed symbol is accepted as typed; a bad one shows "Unknown ticker" on its row. */
function resolveFreeformStockHit(query: string): IStockSearchHit | null {
  const symbol = normalizeStockSymbol(query);
  return symbol ? { symbol, name: symbol } : null;
}

export function StockWatchlistAddField({
  watchlist,
  onAdd,
}: {
  watchlist: readonly IStockWatchlistEntry[];
  onAdd: (entry: IStockWatchlistEntry) => void;
}) {
  const existingIds = useMemo(() => new Set(watchlist.map((e) => e.symbol)), [watchlist]);

  const addHit = useCallback(
    (hit: IStockSearchHit) => {
      onAdd(
        hit.name !== hit.symbol ? { symbol: hit.symbol, name: hit.name } : { symbol: hit.symbol },
      );
    },
    [onAdd],
  );

  return (
    <WatchlistAddField
      existingIds={existingIds}
      atLimit={watchlist.length >= MAX_STOCK_WATCHLIST}
      minQueryLength={MIN_STOCK_SEARCH_QUERY_LENGTH}
      debounceMs={STOCK_SEARCH_DEBOUNCE_MS}
      labels={STOCK_ADD_FIELD_LABELS}
      hitId={stockHitId}
      searchHits={fetchStockSearchHits}
      onAddHit={addHit}
      resolveFreeformHit={resolveFreeformStockHit}
    />
  );
}
