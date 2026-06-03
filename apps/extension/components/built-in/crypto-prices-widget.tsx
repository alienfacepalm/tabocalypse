/**
 * Built-in crypto spot + sparkline panel (BTC, ETH via CoinGecko; no API key).
 */
import React, { useEffect, useMemo, useState } from "react";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import {
  CRYPTO_CHART_DAY_OPTIONS,
  cryptoChartRangeShortLabel,
  cryptoChartRangeTip,
  type TCryptoChartDays,
} from "../../lib/crypto/crypto-chart-days";
import { pickCryptoSnark } from "../../lib/crypto/crypto-snark";
import {
  fetchCoinGeckoMarketRow,
  type ICryptoMarketRow,
} from "../../lib/crypto/fetch-crypto-market";
import type { THumorIntensity } from "../../lib/settings";

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

function AssetRow({ row, locale }: { row: ICryptoMarketRow; locale: string }) {
  const tone = rowTone(row.changePct);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 first:mt-0 first:border-t-0 first:pt-0">
      <span className="w-10 shrink-0 font-display text-xs font-bold uppercase tracking-wider text-text">
        {row.ticker}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm leading-none">
          {formatUsd(locale, row.lastPriceUsd)}
        </p>
        <p className={`mt-0.5 font-mono text-xs ${tone.pct}`}>{formatPct(locale, row.changePct)}</p>
      </div>
      <Sparkline values={row.prices} toneClass={tone.spark} />
    </div>
  );
}

export function CryptoPricesWidget({
  chartDays,
  humorEnabled,
  humorIntensity,
  displayLocale,
  onSelectChartDays,
}: {
  chartDays: TCryptoChartDays;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  displayLocale: string;
  onSelectChartDays: (next: TCryptoChartDays) => void;
}) {
  const [btc, setBtc] = useState<ICryptoMarketRow | null>(null);
  const [eth, setEth] = useState<ICryptoMarketRow | null>(null);
  const [pricesStale, setPricesStale] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    setBtc(null);
    setEth(null);
    setPricesStale(false);
    void Promise.all([
      fetchCoinGeckoMarketRow("bitcoin", "BTC", chartDays),
      fetchCoinGeckoMarketRow("ethereum", "ETH", chartDays),
    ])
      .then(([b, e]) => {
        if (!cancelled) {
          setBtc(b.row);
          setEth(e.row);
          setPricesStale(b.stale || e.stale);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setErr(error instanceof Error ? error.message : "Could not load prices");
      });
    return () => {
      cancelled = true;
    };
  }, [chartDays]);

  const snark = useMemo(() => {
    if (!btc || !eth) return null;
    return pickCryptoSnark({
      humorEnabled,
      humorIntensity,
      chartDays,
      btcChangePct: btc.changePct,
      ethChangePct: eth.changePct,
      locale: displayLocale,
    });
  }, [btc, eth, humorEnabled, humorIntensity, chartDays, displayLocale]);

  return (
    <section className="card flex flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
          <HudPanelTitleInline>Crypto</HudPanelTitleInline>
          <div className="row wrap gap-1" role="group" aria-label="Chart range">
            {CRYPTO_CHART_DAY_OPTIONS.map((d) => (
              <HudTip key={d} tip={cryptoChartRangeTip(d)}>
                <button
                  type="button"
                  className={chartDays === d ? "btn primary sm" : "btn sm"}
                  onClick={() => onSelectChartDays(d)}
                >
                  {cryptoChartRangeShortLabel(d)}
                </button>
              </HudTip>
            ))}
          </div>
        </div>
      </div>
      <HudPanelBody>
        {err ? <p className="err">{err}</p> : null}
        {!err && btc && eth ? (
          <>
            {pricesStale ? (
              <p className="muted text-xs leading-tight" role="status">
                Cached prices — live CoinGecko data is temporarily unavailable.
              </p>
            ) : null}
            <AssetRow row={btc} locale={displayLocale} />
            <AssetRow row={eth} locale={displayLocale} />
            {snark ? (
              <p className="muted mt-3 border-t border-border pt-2 text-xs leading-snug">{snark}</p>
            ) : null}
          </>
        ) : null}
        {!err && (!btc || !eth) ? <p className="muted">Loading…</p> : null}
      </HudPanelBody>
    </section>
  );
}
