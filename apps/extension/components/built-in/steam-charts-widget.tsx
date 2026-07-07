/**
 * Built-in Steam Charts leaderboards panel (steamcharts.com).
 */
import browser from "webextension-polyfill";
import { RefreshCw, Settings2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PanelBody, PanelFetchError, PanelTip, PanelTitleInline } from "../panel-sdk";
import {
  fetchSteamChartsLeaderboard,
  type ISteamChartsLeaderboardResult,
} from "../../lib/steam-charts/fetch-steamcharts-leaderboard";
import { STEAM_CHARTS_BOARD_LABELS, type TSteamChartsBoardKey } from "../../lib/settings";

type TBoardState =
  | { status: "loading" }
  | { status: "ok"; data: ISteamChartsLeaderboardResult }
  | { status: "err"; message: string };

function openSteamChartsApp(appId: number): void {
  void browser.tabs.create({ url: `https://steamcharts.com/app/${appId}` });
}

function formatInt(locale: string, n: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

function formatBoardValue(locale: string, board: TSteamChartsBoardKey, value: number): string {
  if (board === "globalTrendingUp") {
    const pct = value / 100;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(pct)}% of peak`;
  }
  return formatInt(locale, value);
}

function boardToFetchKind(
  board: TSteamChartsBoardKey,
): Parameters<typeof fetchSteamChartsLeaderboard>[0]["kind"] {
  if (board === "globalNow") return "globalNow";
  if (board === "globalPeak24h") return "globalPeak24h";
  if (board === "globalPeakAllTime") return "globalPeakAllTime";
  if (board === "globalTrendingUp") return "globalTrendingUp";
  if (board === "favoritesNow") return "favoritesNow";
  if (board === "favoritesPeak24h") return "favoritesPeak24h";
  return "favoritesPeakAllTime";
}

export function SteamChartsWidget({
  boards,
  rowCount,
  favoriteAppIds,
  displayLocale,
  onOpenSteamSettings,
}: {
  boards: readonly TSteamChartsBoardKey[];
  rowCount: number;
  favoriteAppIds: readonly number[];
  displayLocale: string;
  onOpenSteamSettings: () => void;
}) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [states, setStates] = useState<Record<TSteamChartsBoardKey, TBoardState>>(() => {
    const out: Partial<Record<TSteamChartsBoardKey, TBoardState>> = {};
    for (const b of boards) out[b] = { status: "loading" };
    return out as Record<TSteamChartsBoardKey, TBoardState>;
  });

  const normalizedBoards = useMemo(() => [...boards], [boards]);

  const refresh = useCallback(() => {
    setRefreshToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Partial<Record<TSteamChartsBoardKey, TBoardState>> = {};
      for (const b of normalizedBoards) next[b] = { status: "loading" };
      setStates((prev) => ({ ...prev, ...(next as Record<TSteamChartsBoardKey, TBoardState>) }));

      const results = await Promise.all(
        normalizedBoards.map(async (board) => {
          try {
            const kind = boardToFetchKind(board);
            const data = await fetchSteamChartsLeaderboard({
              kind,
              maxRows: rowCount,
              favoriteAppIds,
            });
            return [board, { status: "ok", data } as const] as const;
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return [board, { status: "err", message } as const] as const;
          }
        }),
      );

      if (cancelled) return;
      setStates((prev) => {
        const merged: Record<TSteamChartsBoardKey, TBoardState> = { ...prev };
        for (const [board, state] of results) merged[board] = state;
        return merged;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [favoriteAppIds, normalizedBoards, refreshToken, rowCount]);

  const anyLoading = normalizedBoards.some((b) => states[b]?.status === "loading");
  const refreshTip = anyLoading ? "Loading Steam Charts…" : "Refresh Steam leaderboards";

  return (
    <PanelBody className="hud-panel steamcharts-panel">
      <div className="hud-panel-title-row">
        <PanelTitleInline>Steam leaderboards</PanelTitleInline>
        <div className="row">
          <PanelTip tip="Customize boards and favorites">
            <button
              type="button"
              className="btn sm has-icon"
              onClick={onOpenSteamSettings}
              aria-label="Open Settings and jump to Steam leaderboards"
            >
              <Settings2 size={16} strokeWidth={2} aria-hidden />
            </button>
          </PanelTip>
          <PanelTip tip={refreshTip}>
            <button
              type="button"
              className="btn sm has-icon"
              onClick={refresh}
              aria-label="Refresh Steam leaderboards"
              disabled={anyLoading}
            >
              <RefreshCw size={16} strokeWidth={2} aria-hidden />
            </button>
          </PanelTip>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {normalizedBoards.map((board) => {
          const st = states[board] ?? { status: "loading" as const };
          const title = STEAM_CHARTS_BOARD_LABELS[board] ?? "Steam";

          return (
            <section
              key={board}
              className="border-t border-border pt-3 first:border-t-0 first:pt-0"
            >
              <p className="mb-2 flex items-center justify-between gap-2 font-display text-xs font-bold uppercase tracking-wider text-muted">
                <span className="truncate">{title}</span>
              </p>

              {st.status === "loading" ? <p className="muted font-mono text-sm">Loading…</p> : null}

              {st.status === "err" ? (
                <PanelFetchError
                  message={st.message}
                  onRetry={refresh}
                  retryTip="Try loading Steam Charts again"
                  retryAriaLabel="Retry loading Steam leaderboards"
                />
              ) : null}

              {st.status === "ok" ? (
                st.data.entries.length > 0 ? (
                  <ol className="flex flex-col gap-1">
                    {st.data.entries.map((row) => (
                      <li key={row.appId} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-right font-mono text-xs text-muted">
                          {row.rank}.
                        </span>
                        <button
                          type="button"
                          className="linkish min-w-0 flex-1 truncate text-left font-mono text-sm"
                          onClick={() => openSteamChartsApp(row.appId)}
                          aria-label={`Open ${row.name} on Steam Charts`}
                        >
                          {row.name}
                        </button>
                        <span className="shrink-0 font-mono text-xs text-text">
                          {formatBoardValue(displayLocale, board, row.value)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted font-mono text-sm">
                    {board.startsWith("favorites")
                      ? "No favorites yet. Add Steam app ids in Settings."
                      : "No data right now."}
                  </p>
                )
              ) : null}
            </section>
          );
        })}
      </div>
    </PanelBody>
  );
}
