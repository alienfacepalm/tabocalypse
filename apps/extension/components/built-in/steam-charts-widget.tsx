/**
 * Built-in Steam Charts leaderboard panel.
 * Open steamcharts.com concurrent players by default (paginated infinite scroll).
 * With a Steam Web API key (+ Steam ID), a chip switches to recently played games with hours.
 * Rows use a virtualized window so tall panels fill without mounting every DOM node.
 */
import browser from "webextension-polyfill";
import { Clock3, RefreshCw, Settings2, Trophy } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { HudVirtualList } from "../hud-virtual-list";
import { PanelBody, PanelFetchError, PanelTip, PanelTitleInline } from "../panel-sdk";
import {
  fetchSteamChartsLeaderboard,
  fetchSteamChartsOpenPage,
  type ISteamChartsLeaderboardEntry,
  type TSteamChartsBoardMode,
  type TSteamChartsLeaderboardSource,
} from "../../lib/steam-charts/fetch-steamcharts-leaderboard";
import { STEAM_VALVE_ATTRIBUTION, steamStoreAppUrl } from "../../lib/steam-charts/steam-app-assets";
import { formatSteamLastPlayedShort } from "../../lib/steam-charts/format-steam-last-played";
import {
  rowsThatFitViewport,
  STEAM_CHARTS_OPEN_ABSOLUTE_MAX,
  STEAM_CHARTS_ROW_HEIGHT_PX,
} from "../../lib/steam-charts/steam-charts-virtual";
import { SteamAppCapsule } from "./steam-app-capsule";
import { SteamIconLogo } from "./steam-icon-logo";

type TBoardState =
  | { status: "loading" }
  | {
      status: "ok";
      source: TSteamChartsLeaderboardSource;
      valueLabel: string;
      entries: ISteamChartsLeaderboardEntry[];
      hasMore: boolean;
      nextPage: number;
    }
  | { status: "err"; message: string };

function openSteamStoreApp(appId: number): void {
  void browser.tabs.create({ url: steamStoreAppUrl(appId) });
}

function formatInt(locale: string, n: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

function formatLeaderboardValue(
  locale: string,
  n: number,
  source: TSteamChartsLeaderboardSource,
): string {
  const num = formatInt(locale, n);
  if (source === "recent") return `${num} hrs`;
  return num;
}

function sourceCaption(source: TSteamChartsLeaderboardSource): string {
  if (source === "recent") return "Recently played · last date · hours";
  return "Top games by players";
}

function mergeOpenEntries(
  prev: ISteamChartsLeaderboardEntry[],
  next: ISteamChartsLeaderboardEntry[],
): ISteamChartsLeaderboardEntry[] {
  const seen = new Set(prev.map((e) => e.appId));
  const merged = [...prev];
  for (const row of next) {
    if (seen.has(row.appId)) continue;
    seen.add(row.appId);
    merged.push({ ...row, rank: merged.length + 1 });
  }
  return merged;
}

function LeaderboardRow({
  row,
  source,
  valueLabel,
  displayLocale,
}: {
  row: ISteamChartsLeaderboardEntry;
  source: TSteamChartsLeaderboardSource;
  valueLabel: string;
  displayLocale: string;
}): React.JSX.Element {
  const valueText = formatLeaderboardValue(displayLocale, row.value, source);
  const lastPlayed =
    source === "recent" ? formatSteamLastPlayedShort(row.lastPlayedAtSec, displayLocale) : null;
  const hoursAria =
    source === "recent"
      ? `${formatInt(displayLocale, row.value)} hours played`
      : `${formatInt(displayLocale, row.value)} ${valueLabel.toLowerCase()}`;
  return (
    <div className="flex h-full items-center gap-2 pr-1">
      <span className="w-5 shrink-0 text-right font-mono text-xs text-muted">{row.rank}.</span>
      <SteamAppCapsule appId={row.appId} name={row.name} />
      <button
        type="button"
        className="linkish min-w-0 flex-1 truncate text-left font-mono text-sm"
        onClick={() => openSteamStoreApp(row.appId)}
        aria-label={`Open ${row.name} on the Steam store`}
      >
        {row.name}
      </button>
      {lastPlayed ? (
        <span
          className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted"
          title="Last played"
          aria-label={`Last played ${lastPlayed}`}
        >
          {lastPlayed}
        </span>
      ) : null}
      <span
        className="shrink-0 font-mono text-xs text-text tabular-nums"
        title={valueLabel}
        aria-label={hoursAria}
      >
        {valueText}
      </span>
    </div>
  );
}

export function SteamChartsWidget({
  rowCount,
  boardMode,
  onBoardModeChange,
  steamWebApiKey,
  steamId,
  displayLocale,
  onOpenSteamSettings,
  onNeedSteamId,
}: {
  rowCount: number;
  boardMode: TSteamChartsBoardMode;
  onBoardModeChange: (mode: TSteamChartsBoardMode) => void;
  steamWebApiKey: string;
  steamId: string;
  displayLocale: string;
  onOpenSteamSettings: () => void;
  /** Opens Settings focused on the Steam ID field (Recently played needs it). */
  onNeedSteamId: () => void;
}) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<TBoardState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [listViewportH, setListViewportH] = useState(0);
  const listHostRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const hasCustomKey = steamWebApiKey.trim().length > 0;
  const hasSteamId = steamId.trim().length > 0;
  const canLoadRecent = hasCustomKey && hasSteamId;
  const maxRows = Math.min(STEAM_CHARTS_OPEN_ABSOLUTE_MAX, Math.max(1, rowCount));
  /** Fill the panel height; Settings max is a floor — tall panels may load more (up to absolute cap). */
  const fillTarget = Math.min(
    STEAM_CHARTS_OPEN_ABSOLUTE_MAX,
    Math.max(maxRows, rowsThatFitViewport(listViewportH, STEAM_CHARTS_ROW_HEIGHT_PX) + 2),
  );

  useEffect(() => {
    if (boardMode === "recent" && !hasCustomKey) {
      onBoardModeChange("open");
    }
  }, [boardMode, hasCustomKey, onBoardModeChange]);

  useEffect(() => {
    const el = listHostRef.current;
    if (!el) return;
    const measure = () => setListViewportH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state.status]);

  const refresh = useCallback(() => {
    setRefreshToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (boardMode === "recent" && !canLoadRecent) {
        setState({
          status: "err",
          message:
            "Recently played needs your Steam ID in addition to the API key. Add it under Settings > Steam® leaderboard.",
        });
        return;
      }
      setState({ status: "loading" });
      setLoadingMore(false);
      loadingMoreRef.current = false;
      try {
        const fitted = rowsThatFitViewport(listViewportH, STEAM_CHARTS_ROW_HEIGHT_PX) + 2;
        const initialRows = Math.min(STEAM_CHARTS_OPEN_ABSOLUTE_MAX, Math.max(fitted, maxRows, 25));
        const data = await fetchSteamChartsLeaderboard({
          mode: boardMode,
          maxRows: initialRows,
          steamWebApiKey,
          steamId,
        });
        if (!cancelled) {
          setState({
            status: "ok",
            source: data.source,
            valueLabel: data.valueLabel,
            entries: data.entries,
            hasMore: data.hasMore === true,
            nextPage: data.nextPage ?? 2,
          });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        if (!cancelled) setState({ status: "err", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boardMode, canLoadRecent, fillTarget, maxRows, refreshToken, steamId, steamWebApiKey]);

  const appendOpenPagesUntil = useCallback(async (want: number) => {
    const cur = stateRef.current;
    if (cur.status !== "ok" || cur.source !== "open") return;
    if (!cur.hasMore || loadingMoreRef.current) return;
    if (cur.entries.length >= want) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      let entries = cur.entries;
      let page = cur.nextPage;
      let hasMore: boolean = cur.hasMore;
      while (entries.length < want && hasMore) {
        const batch = await fetchSteamChartsOpenPage(page);
        entries = mergeOpenEntries(entries, batch.entries).slice(0, want);
        hasMore = batch.hasMore && entries.length < want;
        page += 1;
        if (batch.entries.length === 0) {
          hasMore = false;
          break;
        }
      }
      setState((prev) => {
        if (prev.status !== "ok" || prev.source !== "open") return prev;
        return {
          ...prev,
          entries,
          hasMore,
          nextPage: page,
        };
      });
    } catch {
      // Keep existing rows; user can refresh.
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const entriesLength = state.status === "ok" ? state.entries.length : 0;
  const hasMoreOpen = state.status === "ok" ? state.hasMore : false;

  // Fill newly available panel height (and scroll-load more up to Settings max).
  useEffect(() => {
    if (boardMode !== "open" || state.status !== "ok") return;
    if (entriesLength >= fillTarget || !hasMoreOpen) return;
    void appendOpenPagesUntil(fillTarget);
  }, [appendOpenPagesUntil, boardMode, entriesLength, fillTarget, hasMoreOpen, state.status]);

  const loadMoreOpen = useCallback(() => {
    void appendOpenPagesUntil(STEAM_CHARTS_OPEN_ABSOLUTE_MAX);
  }, [appendOpenPagesUntil]);

  const loading = state.status === "loading";
  const refreshTip = loading ? "Loading…" : "Refresh";
  const settingsTip = hasCustomKey ? "Steam settings" : "Add API key (optional)";
  const missingSteamIdForRecent = boardMode === "recent" && !canLoadRecent;

  return (
    <section className="card flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <SteamIconLogo size={22} />
            <PanelTitleInline>Steam® leaderboard</PanelTitleInline>
          </div>
          <div className="row">
            <PanelTip tip={settingsTip}>
              <button
                type="button"
                className="btn sm has-icon"
                onClick={onOpenSteamSettings}
                aria-label="Open Settings > Steam leaderboard"
              >
                <Settings2 size={16} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
            <PanelTip tip={refreshTip}>
              <button
                type="button"
                className="btn sm has-icon"
                onClick={refresh}
                aria-label="Refresh Steam leaderboard"
                disabled={loading || missingSteamIdForRecent}
              >
                <RefreshCw size={16} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
          </div>
        </div>
        {state.status === "ok" ? (
          <p className="muted mt-1 mb-0 font-mono text-xs">{sourceCaption(state.source)}</p>
        ) : boardMode === "recent" ? (
          <p className="muted mt-1 mb-0 font-mono text-xs">Recently played</p>
        ) : (
          <p className="muted mt-1 mb-0 font-mono text-xs">Top games by players</p>
        )}
        {hasCustomKey ? (
          <div className="row wrap mt-2" role="group" aria-label="Steam leaderboard boards">
            <PanelTip tip="Public top games by concurrent players">
              <button
                type="button"
                className={boardMode === "open" ? "btn primary sm has-icon" : "btn sm has-icon"}
                aria-pressed={boardMode === "open"}
                onClick={() => onBoardModeChange("open")}
              >
                <Trophy size={14} strokeWidth={2} aria-hidden />
                <span>Top players</span>
              </button>
            </PanelTip>
            <PanelTip
              tip={
                canLoadRecent
                  ? "Your games by last played date, with lifetime hours"
                  : "Needs Steam ID (API key alone is not enough)"
              }
            >
              <button
                type="button"
                className={boardMode === "recent" ? "btn primary sm has-icon" : "btn sm has-icon"}
                aria-pressed={boardMode === "recent"}
                onClick={() => onBoardModeChange("recent")}
              >
                <Clock3 size={14} strokeWidth={2} aria-hidden />
                <span>Recently played</span>
              </button>
            </PanelTip>
          </div>
        ) : null}
      </div>

      <PanelBody bodyOverflow={false} className="flex min-h-0 flex-1 flex-col gap-2">
        {loading ? <p className="muted shrink-0 font-mono text-sm">Loading…</p> : null}

        {missingSteamIdForRecent ? (
          <div className="flex flex-col gap-3">
            <p className="err mb-0">
              Recently played needs your Steam ID — the API key alone is not enough.
            </p>
            <p className="muted mb-0 font-mono text-xs leading-snug">
              Add your profile name or 17-digit Steam ID under Settings, then try again.
            </p>
            <div>
              <PanelTip tip="Open Settings and focus the Steam ID field">
                <button
                  type="button"
                  className="btn primary sm has-icon"
                  onClick={onNeedSteamId}
                  aria-label="Open Settings > Steam® leaderboard and focus Steam ID"
                >
                  <Settings2 size={16} strokeWidth={2} aria-hidden />
                  <span>Add Steam ID</span>
                </button>
              </PanelTip>
            </div>
          </div>
        ) : null}

        {state.status === "err" && !missingSteamIdForRecent ? (
          <PanelFetchError
            message={state.message}
            onRetry={refresh}
            retryTip="Try loading Steam Charts again"
            retryAriaLabel="Retry loading Steam leaderboard"
          />
        ) : null}

        {state.status === "ok" ? (
          state.entries.length > 0 ? (
            <div ref={listHostRef} className="flex min-h-0 flex-1 flex-col">
              <HudVirtualList
                items={state.entries}
                itemHeight={STEAM_CHARTS_ROW_HEIGHT_PX}
                getItemKey={(row) => row.appId}
                aria-label="Steam leaderboard rows"
                onNearEnd={boardMode === "open" ? loadMoreOpen : undefined}
                renderItem={(row) => (
                  <LeaderboardRow
                    row={row}
                    source={state.source}
                    valueLabel={state.valueLabel}
                    displayLocale={displayLocale}
                  />
                )}
              />
              {loadingMore ? (
                <p className="muted shrink-0 py-1 font-mono text-[10px]">Loading more…</p>
              ) : null}
            </div>
          ) : (
            <p className="muted font-mono text-sm">
              {boardMode === "recent"
                ? "No recently played games (or the profile is private)."
                : "No data right now."}
            </p>
          )
        ) : state.status === "loading" ? (
          <div ref={listHostRef} className="min-h-0 flex-1" aria-hidden />
        ) : null}

        {!hasCustomKey ? (
          <p className="muted mb-0 shrink-0 font-mono text-xs">
            <button type="button" className="linkish" onClick={onOpenSteamSettings}>
              Add API key
            </button>{" "}
            for recently played hours
          </p>
        ) : hasCustomKey && !hasSteamId && boardMode !== "recent" ? (
          <p className="muted mb-0 shrink-0 font-mono text-xs">
            <button type="button" className="linkish" onClick={onNeedSteamId}>
              Add Steam ID
            </button>{" "}
            to unlock Recently played
          </p>
        ) : null}

        <p
          className="muted mb-0 shrink-0 text-[10px] leading-snug opacity-80"
          title={`${STEAM_VALVE_ATTRIBUTION} Game artwork © respective owners; Steam CDN for identification only. Not affiliated with Valve.`}
        >
          {STEAM_VALVE_ATTRIBUTION}
        </p>
      </PanelBody>
    </section>
  );
}
