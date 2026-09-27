/**
 * Built-in markets panel: Stocks (Yahoo Finance) or Crypto (CoinGecko) spot + sparkline rows.
 * The title toggle picks one list at a time; neither source needs an API key.
 */
import { GripVertical, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanelBody, PanelTip, PanelTitleInline } from "../panel-sdk";
import {
  CRYPTO_CHART_DAY_OPTIONS,
  cryptoChartRangeShortLabel,
  cryptoChartRangeTip,
  type TCryptoChartDays,
} from "../../lib/crypto/crypto-chart-days";
import { pickCryptoSnark } from "../../lib/crypto/crypto-snark";
import {
  canRemoveCryptoWatchlistEntry,
  normalizeCryptoWatchlistEntry,
  type ICryptoWatchlistEntry,
} from "../../lib/crypto/crypto-watchlist";
import {
  fetchCoinGeckoMarketRow,
  type ICryptoMarketRow,
} from "../../lib/crypto/fetch-crypto-market";
import { fetchCryptoWatchlistIconUrls } from "../../lib/crypto/fetch-crypto-watchlist-icons";
import { orderListByIds } from "../../lib/move-list-item";
import type { THumorIntensity } from "../../lib/settings";
import { fetchStockMarketRow } from "../../lib/stocks/fetch-stock-market";
import {
  MARKETS_PANEL_VIEWS,
  marketsPanelViewLabel,
  type TMarketsPanelView,
} from "../../lib/stocks/markets-panel-view";
import {
  canRemoveStockWatchlistEntry,
  normalizeStockWatchlistEntry,
  type IStockWatchlistEntry,
} from "../../lib/stocks/stock-watchlist";
import { CryptoCoinIcon } from "./crypto-coin-icon";
import { CryptoWatchlistAddField } from "./crypto-watchlist-add-field";
import { StockWatchlistAddField } from "./stock-watchlist-add-field";
import { useRowDragReorder, type IRowDragReorderGripProps } from "./use-row-drag-reorder";

type TCryptoRowState =
  | { status: "loading" }
  | { status: "ok"; row: ICryptoMarketRow; stale: boolean }
  | { status: "err"; message: string };

function Sparkline({ values, toneClass }: { values: readonly number[]; toneClass: string }) {
  if (values.length < 2) {
    return <span className="muted shrink-0 font-mono text-xs">—</span>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 3;
  const w = 100;
  const h = 36;
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - pad - ((v - min) / span) * (h - 2 * pad);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg
      className={`h-9 w-20 shrink-0 ${toneClass}`}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={pts}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function formatPrice(locale: string, n: number, currency = "USD"): string {
  // Yahoo sub-unit codes (e.g. `GBp` pence) are not ISO 4217; show them as a plain suffix.
  if (!/^[A-Z]{3}$/.test(currency)) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n)} ${currency}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
    minimumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);
}

function formatPct(locale: string, pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(pct)}%`;
}

function rowTone(changePct: number): { pct: string; spark: string } {
  if (changePct > 0.05) return { pct: "crypto-trend-up", spark: "crypto-trend-up" };
  if (changePct < -0.05) return { pct: "crypto-trend-down", spark: "crypto-trend-down" };
  return { pct: "text-muted", spark: "crypto-trend-flat" };
}

function AssetRow({
  id,
  gripProps,
  dragging,
  symbol,
  name,
  icon,
  state,
  locale,
  canRemove,
  onRemove,
}: {
  id: string;
  /** Present when the list has more than one row to reorder. */
  gripProps?: IRowDragReorderGripProps;
  dragging: boolean;
  symbol: string;
  /** Full instrument name, surfaced as a tooltip on the ticker. */
  name?: string;
  icon?: React.ReactNode;
  state: TCryptoRowState;
  locale: string;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      data-reorder-row-id={id}
      className={`mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 first:mt-0 first:border-t-0 first:pt-0 ${
        dragging ? "opacity-60" : ""
      }`}
    >
      {gripProps ? (
        <PanelTip tip={`Drag to reorder ${symbol} (or focus and press ↑ / ↓)`}>
          <button
            type="button"
            className={`-mr-1 shrink-0 touch-none border-0 bg-transparent p-0 text-muted hover:text-text ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            aria-label={`Reorder ${symbol}`}
            {...gripProps}
          >
            <GripVertical size={14} strokeWidth={2} aria-hidden />
          </button>
        </PanelTip>
      ) : null}
      <div className="flex w-[4.5rem] shrink-0 items-center gap-1.5">
        {icon}
        <span
          className="truncate font-display text-xs font-bold uppercase tracking-wider text-text"
          title={name}
        >
          {symbol}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {state.status === "loading" ? (
          <p className="muted font-mono text-sm leading-none">Loading…</p>
        ) : null}
        {state.status === "err" ? (
          <p className="err font-mono text-xs leading-snug">{state.message}</p>
        ) : null}
        {state.status === "ok" ? (
          <>
            <p className="truncate font-mono text-sm leading-none">
              {formatPrice(locale, state.row.lastPriceUsd, state.row.currency)}
            </p>
            <p className={`mt-0.5 font-mono text-xs ${rowTone(state.row.changePct).pct}`}>
              {formatPct(locale, state.row.changePct)}
            </p>
          </>
        ) : null}
      </div>
      {state.status === "ok" ? (
        <Sparkline values={state.row.prices} toneClass={rowTone(state.row.changePct).spark} />
      ) : (
        <span className="h-9 w-20 shrink-0" aria-hidden />
      )}
      {canRemove ? (
        <PanelTip tip={`Remove ${symbol} from your watchlist`}>
          <button
            type="button"
            className="btn ghost icon-only shrink-0"
            aria-label={`Remove ${symbol}`}
            onClick={onRemove}
          >
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        </PanelTip>
      ) : (
        <span className="w-8 shrink-0" aria-hidden />
      )}
    </div>
  );
}

interface IMarketListItem {
  /** Row-state key: CoinGecko coin id or Yahoo symbol. */
  id: string;
  symbol: string;
  name?: string;
  cryptoEntry?: ICryptoWatchlistEntry;
}

function MarketsViewToggle({
  view,
  onSelectView,
}: {
  view: TMarketsPanelView;
  onSelectView: (next: TMarketsPanelView) => void;
}) {
  return (
    <span className="inline-flex items-baseline gap-2" role="group" aria-label="Market">
      {MARKETS_PANEL_VIEWS.map((v, index) => (
        <React.Fragment key={v}>
          {index > 0 ? (
            <span className="text-muted" aria-hidden>
              /
            </span>
          ) : null}
          <button
            type="button"
            aria-pressed={view === v}
            className={`cursor-pointer border-0 bg-transparent p-0 [font:inherit] [letter-spacing:inherit] [text-transform:inherit] ${
              view === v ? "text-inherit" : "text-muted hover:text-text"
            }`}
            onClick={() => {
              if (view !== v) onSelectView(v);
            }}
          >
            {marketsPanelViewLabel(v)}
          </button>
        </React.Fragment>
      ))}
    </span>
  );
}

export function CryptoPricesWidget({
  view,
  watchlist,
  stockWatchlist,
  chartDays,
  humorEnabled,
  humorIntensity,
  displayLocale,
  onSelectView,
  onSelectChartDays,
  onWatchlistChange,
  onStockWatchlistChange,
}: {
  view: TMarketsPanelView;
  watchlist: ICryptoWatchlistEntry[];
  stockWatchlist: IStockWatchlistEntry[];
  chartDays: TCryptoChartDays;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  displayLocale: string;
  onSelectView: (next: TMarketsPanelView) => void;
  onSelectChartDays: (next: TCryptoChartDays) => void;
  onWatchlistChange: (next: ICryptoWatchlistEntry[]) => void;
  onStockWatchlistChange: (next: IStockWatchlistEntry[]) => void;
}) {
  const [rowStates, setRowStates] = useState<Record<string, TCryptoRowState>>({});
  const onWatchlistChangeRef = useRef(onWatchlistChange);
  onWatchlistChangeRef.current = onWatchlistChange;
  const isStocks = view === "stocks";

  const missingIconCoinIdsKey = useMemo(
    () =>
      isStocks
        ? ""
        : watchlist
            .filter((entry) => !entry.iconUrl)
            .map((entry) => entry.coinId)
            .sort()
            .join(","),
    [isStocks, watchlist],
  );

  useEffect(() => {
    if (!missingIconCoinIdsKey) return;
    let cancelled = false;
    const ac = new AbortController();
    const missingIds = missingIconCoinIdsKey.split(",");
    void fetchCryptoWatchlistIconUrls(missingIds, ac.signal)
      .then((icons) => {
        if (cancelled) return;
        let changed = false;
        const next = watchlist.map((entry) => {
          const iconUrl = icons[entry.coinId];
          if (!entry.iconUrl && iconUrl) {
            changed = true;
            return { ...entry, iconUrl };
          }
          return entry;
        });
        if (changed) onWatchlistChangeRef.current(next);
      })
      .catch(() => {
        // Icons are cosmetic; price rows still load without them.
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [missingIconCoinIdsKey, watchlist]);

  const items = useMemo<IMarketListItem[]>(
    () =>
      isStocks
        ? stockWatchlist.map((entry) => ({
            id: entry.symbol,
            symbol: entry.symbol,
            name: entry.name,
          }))
        : watchlist.map((entry) => ({
            id: entry.coinId,
            symbol: entry.symbol,
            cryptoEntry: entry,
          })),
    [isStocks, stockWatchlist, watchlist],
  );

  // Keyed on the set of rows, not their order, so reordering never refetches or flashes "Loading…".
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const fetchKey = useMemo(
    () =>
      `${view}|${items
        .map((item) => `${item.id}:${item.symbol}`)
        .sort()
        .join(",")}`,
    [view, items],
  );

  useEffect(() => {
    let cancelled = false;
    const rows = itemsRef.current;
    const stocksView = fetchKey.startsWith("stocks|");
    const nextStates: Record<string, TCryptoRowState> = {};
    for (const item of rows) {
      nextStates[item.id] = { status: "loading" };
    }
    setRowStates(nextStates);

    for (const item of rows) {
      const request = stocksView
        ? fetchStockMarketRow(item.symbol, chartDays)
        : fetchCoinGeckoMarketRow(item.id, item.symbol, chartDays);
      void request
        .then((result) => {
          if (cancelled) return;
          setRowStates((prev) => ({
            ...prev,
            [item.id]: { status: "ok", row: result.row, stale: result.stale },
          }));
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : "Could not load prices";
          setRowStates((prev) => ({
            ...prev,
            [item.id]: { status: "err", message },
          }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [fetchKey, chartDays]);

  const loadedRows = useMemo(
    () =>
      items
        .map((item) => {
          const state = rowStates[item.id];
          return state?.status === "ok" ? state.row : null;
        })
        .filter((row): row is ICryptoMarketRow => row !== null),
    [rowStates, items],
  );

  const anyStale = useMemo(
    () =>
      items.some((item) => {
        const state = rowStates[item.id];
        return state?.status === "ok" && state.stale;
      }),
    [rowStates, items],
  );

  const allSettled = items.every((item) => {
    const state = rowStates[item.id];
    return state && state.status !== "loading";
  });

  const snark = useMemo(() => {
    // Snark lines are written about coins; the Stocks list stays deadpan.
    if (isStocks || loadedRows.length < 2) return null;
    return pickCryptoSnark({
      humorEnabled,
      humorIntensity,
      chartDays,
      primaryChangePct: loadedRows[0]!.changePct,
      secondaryChangePct: loadedRows[1]!.changePct,
      locale: displayLocale,
    });
  }, [isStocks, loadedRows, humorEnabled, humorIntensity, chartDays, displayLocale]);

  const removable = isStocks
    ? canRemoveStockWatchlistEntry(stockWatchlist)
    : canRemoveCryptoWatchlistEntry(watchlist);

  const addEntry = (entry: ICryptoWatchlistEntry) => {
    const normalized = normalizeCryptoWatchlistEntry(entry);
    if (!normalized) return;
    if (watchlist.some((w) => w.coinId === normalized.coinId)) return;
    onWatchlistChange([...watchlist, normalized]);
  };

  const addStockEntry = (entry: IStockWatchlistEntry) => {
    const normalized = normalizeStockWatchlistEntry(entry);
    if (!normalized) return;
    if (stockWatchlist.some((w) => w.symbol === normalized.symbol)) return;
    onStockWatchlistChange([...stockWatchlist, normalized]);
  };

  const listRef = useRef<HTMLDivElement>(null);
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const { orderedIds, draggingId, gripProps } = useRowDragReorder({
    ids: itemIds,
    listRef,
    onCommit: (nextIds) => {
      if (isStocks)
        onStockWatchlistChange(orderListByIds(stockWatchlist, nextIds, (e) => e.symbol));
      else onWatchlistChange(orderListByIds(watchlist, nextIds, (e) => e.coinId));
    },
  });
  const orderedItems = useMemo(
    () => orderListByIds(items, orderedIds, (item) => item.id),
    [items, orderedIds],
  );
  const reorderable = items.length > 1;

  const removeItem = (id: string) => {
    if (!removable) return;
    if (isStocks) onStockWatchlistChange(stockWatchlist.filter((e) => e.symbol !== id));
    else onWatchlistChange(watchlist.filter((e) => e.coinId !== id));
  };

  return (
    <section className="card flex flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
          <PanelTitleInline>
            <MarketsViewToggle view={view} onSelectView={onSelectView} />
          </PanelTitleInline>
          <div className="row wrap gap-1" role="group" aria-label="Chart range">
            {CRYPTO_CHART_DAY_OPTIONS.map((d) => (
              <PanelTip key={d} tip={cryptoChartRangeTip(d)}>
                <button
                  type="button"
                  className={chartDays === d ? "btn primary sm" : "btn sm"}
                  onClick={() => onSelectChartDays(d)}
                >
                  {cryptoChartRangeShortLabel(d)}
                </button>
              </PanelTip>
            ))}
          </div>
        </div>
      </div>
      <PanelBody>
        {anyStale ? (
          <p className="muted text-xs leading-tight" role="status">
            Cached prices — live {isStocks ? "Yahoo Finance" : "CoinGecko"} data is temporarily
            unavailable.
          </p>
        ) : null}
        <div ref={listRef}>
          {orderedItems.map((item) => (
            <AssetRow
              key={item.id}
              id={item.id}
              gripProps={reorderable ? gripProps(item.id) : undefined}
              dragging={draggingId === item.id}
              symbol={item.symbol}
              name={item.name}
              icon={item.cryptoEntry ? <CryptoCoinIcon entry={item.cryptoEntry} size="sm" /> : null}
              state={rowStates[item.id] ?? { status: "loading" }}
              locale={displayLocale}
              canRemove={removable}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
        {!allSettled && items.length > 0 ? (
          <p className="muted sr-only" role="status">
            Loading {isStocks ? "stock" : "crypto"} prices
          </p>
        ) : null}
        {snark ? (
          <p className="muted mt-3 border-t border-border pt-2 text-xs leading-snug">{snark}</p>
        ) : null}
        {isStocks ? (
          <StockWatchlistAddField key="stocks" watchlist={stockWatchlist} onAdd={addStockEntry} />
        ) : (
          <CryptoWatchlistAddField key="crypto" watchlist={watchlist} onAdd={addEntry} />
        )}
      </PanelBody>
    </section>
  );
}
