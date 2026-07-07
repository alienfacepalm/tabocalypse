/**
 * Built-in crypto spot + sparkline panel (CoinGecko; no API key).
 */
import { X } from "lucide-react";
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
import type { THumorIntensity } from "../../lib/settings";
import { CryptoCoinIcon } from "./crypto-coin-icon";
import { CryptoWatchlistAddField } from "./crypto-watchlist-add-field";

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

function formatUsd(locale: string, n: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
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
  entry,
  state,
  locale,
  canRemove,
  onRemove,
}: {
  entry: ICryptoWatchlistEntry;
  state: TCryptoRowState;
  locale: string;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 first:mt-0 first:border-t-0 first:pt-0">
      <div className="flex w-[4.5rem] shrink-0 items-center gap-1.5">
        <CryptoCoinIcon entry={entry} size="sm" />
        <span className="font-display text-xs font-bold uppercase tracking-wider text-text">
          {entry.symbol}
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
              {formatUsd(locale, state.row.lastPriceUsd)}
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
        <PanelTip tip={`Remove ${entry.symbol} from your watchlist`}>
          <button
            type="button"
            className="btn ghost icon-only shrink-0"
            aria-label={`Remove ${entry.symbol}`}
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

export function CryptoPricesWidget({
  watchlist,
  chartDays,
  humorEnabled,
  humorIntensity,
  displayLocale,
  onSelectChartDays,
  onWatchlistChange,
}: {
  watchlist: ICryptoWatchlistEntry[];
  chartDays: TCryptoChartDays;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  displayLocale: string;
  onSelectChartDays: (next: TCryptoChartDays) => void;
  onWatchlistChange: (next: ICryptoWatchlistEntry[]) => void;
}) {
  const [rowStates, setRowStates] = useState<Record<string, TCryptoRowState>>({});
  const onWatchlistChangeRef = useRef(onWatchlistChange);
  onWatchlistChangeRef.current = onWatchlistChange;

  const missingIconCoinIdsKey = useMemo(
    () =>
      watchlist
        .filter((entry) => !entry.iconUrl)
        .map((entry) => entry.coinId)
        .sort()
        .join(","),
    [watchlist],
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

  useEffect(() => {
    let cancelled = false;
    const nextStates: Record<string, TCryptoRowState> = {};
    for (const entry of watchlist) {
      nextStates[entry.coinId] = { status: "loading" };
    }
    setRowStates(nextStates);

    for (const entry of watchlist) {
      void fetchCoinGeckoMarketRow(entry.coinId, entry.symbol, chartDays)
        .then((result) => {
          if (cancelled) return;
          setRowStates((prev) => ({
            ...prev,
            [entry.coinId]: { status: "ok", row: result.row, stale: result.stale },
          }));
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : "Could not load prices";
          setRowStates((prev) => ({
            ...prev,
            [entry.coinId]: { status: "err", message },
          }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [watchlist, chartDays]);

  const loadedRows = useMemo(
    () =>
      watchlist
        .map((entry) => {
          const state = rowStates[entry.coinId];
          return state?.status === "ok" ? state.row : null;
        })
        .filter((row): row is ICryptoMarketRow => row !== null),
    [rowStates, watchlist],
  );

  const anyStale = useMemo(
    () =>
      watchlist.some((entry) => {
        const state = rowStates[entry.coinId];
        return state?.status === "ok" && state.stale;
      }),
    [rowStates, watchlist],
  );

  const allSettled = watchlist.every((entry) => {
    const state = rowStates[entry.coinId];
    return state && state.status !== "loading";
  });

  const snark = useMemo(() => {
    if (loadedRows.length < 2) return null;
    return pickCryptoSnark({
      humorEnabled,
      humorIntensity,
      chartDays,
      primaryChangePct: loadedRows[0]!.changePct,
      secondaryChangePct: loadedRows[1]!.changePct,
      locale: displayLocale,
    });
  }, [loadedRows, humorEnabled, humorIntensity, chartDays, displayLocale]);

  const removable = canRemoveCryptoWatchlistEntry(watchlist);

  const addEntry = (entry: ICryptoWatchlistEntry) => {
    const normalized = normalizeCryptoWatchlistEntry(entry);
    if (!normalized) return;
    if (watchlist.some((w) => w.coinId === normalized.coinId)) return;
    onWatchlistChange([...watchlist, normalized]);
  };

  const removeEntry = (coinId: string) => {
    if (!removable) return;
    onWatchlistChange(watchlist.filter((e) => e.coinId !== coinId));
  };

  return (
    <section className="card flex flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
          <PanelTitleInline>Crypto</PanelTitleInline>
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
            Cached prices — live CoinGecko data is temporarily unavailable.
          </p>
        ) : null}
        {watchlist.map((entry) => (
          <AssetRow
            key={entry.coinId}
            entry={entry}
            state={rowStates[entry.coinId] ?? { status: "loading" }}
            locale={displayLocale}
            canRemove={removable}
            onRemove={() => removeEntry(entry.coinId)}
          />
        ))}
        {!allSettled && watchlist.length > 0 ? (
          <p className="muted sr-only" role="status">
            Loading crypto prices
          </p>
        ) : null}
        {snark ? (
          <p className="muted mt-3 border-t border-border pt-2 text-xs leading-snug">{snark}</p>
        ) : null}
        <CryptoWatchlistAddField watchlist={watchlist} onAdd={addEntry} />
      </PanelBody>
    </section>
  );
}
