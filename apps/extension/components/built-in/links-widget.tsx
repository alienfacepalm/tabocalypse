import { ChevronDown, ChevronUp, EyeOff } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import browser from "webextension-polyfill";
import { coerceAlarmMetaMessage } from "../../lib/alarm-meta-message";
import {
  applyBookmarksStripPreferences,
  reorderBookmarksStripVisibleIds,
  type TBookmarksStripItem,
} from "../../lib/bookmarks-strip-preferences";
import { rankBookmarksBySearchRelevance } from "../../lib/bookmark-search-relevance";
import { faviconUrl } from "../../lib/favicon-url";
import { rowsThatFitViewport } from "../../lib/hud-virtual-window";
import { HudVirtualList } from "../hud-virtual-list";
import { PanelBody, PanelTip, PanelTitle, PanelTitleInline } from "../panel-sdk";

/** Row height for bookmarks virtual list (favicon + actions + gap). */
const BOOKMARKS_ROW_HEIGHT_PX = 32;
/** Minimum recent/search fetch when the panel has not been measured yet. */
const BOOKMARKS_FETCH_MIN = 16;
/** Cap aligned with bookmarks strip preference storage. */
const BOOKMARKS_FETCH_MAX = 256;

function bookmarksFetchCount(viewportHeightPx: number): number {
  const fitted = rowsThatFitViewport(viewportHeightPx, BOOKMARKS_ROW_HEIGHT_PX) + 4;
  return Math.min(BOOKMARKS_FETCH_MAX, Math.max(BOOKMARKS_FETCH_MIN, fitted));
}

export function TopSitesWidget({
  permissionsEpoch,
  onOpenTopSitesSettings,
}: {
  permissionsEpoch: number;
  onOpenTopSitesSettings: () => void;
}) {
  const [sites, setSites] = useState<{ url?: string; title?: string }[]>([]);
  const [err, setErr] = useState<"permission" | null>(null);

  useEffect(() => {
    setErr(null);
    setSites([]);
    const api = browser.topSites;
    if (!api?.get) {
      setErr("permission");
      return;
    }
    void api
      .get()
      .then((s) => setSites(s.slice(0, 12)))
      .catch(() => setErr("permission"));
  }, [permissionsEpoch]);

  if (err)
    return (
      <section className="card">
        <PanelTitle>Top sites</PanelTitle>
        <PanelBody>
          <p className="err">
            Top sites needs browser permission. Open{" "}
            <PanelTip tip="Open Settings and jump to Optional permissions">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenTopSitesSettings}
                aria-label="Open Settings and jump to Optional permissions to enable Top sites"
              >
                Settings &gt; Optional permissions
              </button>
            </PanelTip>{" "}
            and enable Top sites.
          </p>
        </PanelBody>
      </section>
    );

  return (
    <section className="card">
      <PanelTitle>Top sites</PanelTitle>
      <PanelBody>
        <ul className="link-grid">
          {sites.map((s, i) => (
            <li key={i}>
              <a href={s.url} target="_blank" rel="noreferrer">
                <img
                  src={faviconUrl(s.url ?? "")}
                  alt=""
                  width={16}
                  height={16}
                  className="favicon"
                />
                {coerceAlarmMetaMessage(s.title as unknown) || s.url}
              </a>
            </li>
          ))}
        </ul>
      </PanelBody>
    </section>
  );
}

type TBookmarkRow = { id: string; title?: string; url?: string };

function BookmarkListRow({
  bookmark,
  index,
  total,
  searchActive,
  onReorder,
  onHide,
}: {
  bookmark: TBookmarkRow;
  index: number;
  total: number;
  searchActive: boolean;
  onReorder: (bookmarkId: string, direction: "up" | "down") => void;
  onHide: (bookmark: TBookmarksStripItem) => void;
}): React.JSX.Element {
  const label = coerceAlarmMetaMessage(bookmark.title as unknown) || bookmark.url || "";
  const cannotMoveUp = searchActive || index === 0;
  const cannotMoveDown = searchActive || index >= total - 1;
  return (
    <div className="link-grid-row h-full">
      <PanelTip tip={label} wrapClassName="block min-w-0 flex-1">
        <a href={bookmark.url} target="_blank" rel="noreferrer">
          <img
            src={faviconUrl(bookmark.url ?? "")}
            alt=""
            width={16}
            height={16}
            className="favicon"
          />
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </a>
      </PanelTip>
      <div className="link-grid-row-actions">
        {!searchActive ? (
          <>
            <PanelTip
              tip={
                cannotMoveUp
                  ? "Already first in the list"
                  : "Move this bookmark earlier in the list"
              }
            >
              <button
                type="button"
                className="btn ghost icon-only sm disabled:pointer-events-none"
                aria-label={
                  cannotMoveUp
                    ? "Bookmark is already first in the list"
                    : "Move bookmark earlier in the list"
                }
                title={cannotMoveUp ? "Already first in the list" : undefined}
                disabled={cannotMoveUp}
                onClick={() => onReorder(bookmark.id, "up")}
              >
                <ChevronUp size={14} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
            <PanelTip
              tip={
                cannotMoveDown ? "Already last in the list" : "Move this bookmark later in the list"
              }
            >
              <button
                type="button"
                className="btn ghost icon-only sm disabled:pointer-events-none"
                aria-label={
                  cannotMoveDown
                    ? "Bookmark is already last in the list"
                    : "Move bookmark later in the list"
                }
                title={cannotMoveDown ? "Already last in the list" : undefined}
                disabled={cannotMoveDown}
                onClick={() => onReorder(bookmark.id, "down")}
              >
                <ChevronDown size={14} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
          </>
        ) : null}
        <PanelTip tip="Hide this bookmark from the panel (unhide in Settings > Bookmarks)">
          <button
            type="button"
            className="btn ghost icon-only sm"
            aria-label="Hide bookmark from panel"
            onClick={() =>
              onHide({
                id: bookmark.id,
                title: bookmark.title,
                url: bookmark.url,
              })
            }
          >
            <EyeOff size={14} strokeWidth={2} aria-hidden />
          </button>
        </PanelTip>
      </div>
    </div>
  );
}

export function BookmarksWidget({
  permissionsEpoch,
  hidden,
  orderIds,
  onHideBookmark,
  onOrderIdsChange,
  onOpenBookmarksHiddenSettings,
  onOpenBookmarksPermissionSettings,
}: {
  permissionsEpoch: number;
  hidden: TBookmarksStripItem[];
  orderIds: string[];
  onHideBookmark: (bookmark: TBookmarksStripItem) => void;
  onOrderIdsChange: (nextOrderIds: string[]) => void;
  onOpenBookmarksPermissionSettings: () => void;
  onOpenBookmarksHiddenSettings: () => void;
}) {
  const [marks, setMarks] = useState<TBookmarkRow[]>([]);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState<"permission" | null>(null);
  const [listViewportH, setListViewportH] = useState(0);
  const listHostRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = query.trim();
  const searchActive = trimmedQuery.length > 0;
  const fetchCount = bookmarksFetchCount(listViewportH);

  useEffect(() => {
    const el = listHostRef.current;
    if (!el) return;
    const measure = () => setListViewportH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [err]);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    const api = browser.bookmarks;
    if (!api?.getRecent) {
      setErr("permission");
      setMarks([]);
      return;
    }
    const load = searchActive
      ? api.search(trimmedQuery).then((results) =>
          rankBookmarksBySearchRelevance(
            results.filter((b) => b.url),
            trimmedQuery,
          ).slice(0, fetchCount),
        )
      : api.getRecent(fetchCount);
    void load
      .then((results) => {
        if (!cancelled) setMarks(results);
      })
      .catch(() => {
        if (!cancelled) setErr("permission");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchCount, permissionsEpoch, searchActive, trimmedQuery]);

  const visibleMarks = useMemo(
    () => applyBookmarksStripPreferences(marks, hidden, orderIds),
    [hidden, marks, orderIds],
  );

  const handleReorder = useCallback(
    (bookmarkId: string, direction: "up" | "down") => {
      onOrderIdsChange(
        reorderBookmarksStripVisibleIds(
          visibleMarks.map((item) => item.id),
          orderIds,
          bookmarkId,
          direction,
        ),
      );
    },
    [onOrderIdsChange, orderIds, visibleMarks],
  );

  if (err)
    return (
      <section className="card flex h-full min-h-0 flex-col">
        <PanelTitle>Bookmarks</PanelTitle>
        <PanelBody>
          <p className="err">
            Bookmarks need browser permission. Open{" "}
            <PanelTip tip="Open Settings and jump to Optional permissions">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenBookmarksPermissionSettings}
                aria-label="Open Settings and jump to Optional permissions to enable Bookmarks"
              >
                Settings &gt; Optional permissions
              </button>
            </PanelTip>{" "}
            and enable Bookmarks.
          </p>
        </PanelBody>
      </section>
    );

  return (
    <section className="card flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <PanelTitleInline>Bookmarks</PanelTitleInline>
        <input
          type="search"
          className="w-[8.5rem] max-w-[min(42%,12rem)] shrink-0 rounded-full border border-solid border-accent/30 bg-black/40 px-3 py-1 text-xs text-text normal-case tracking-normal backdrop-blur-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent2/60"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search bookmarks"
        />
      </div>
      <PanelBody bodyOverflow={false} className="flex min-h-0 flex-1 flex-col gap-2">
        {hidden.length > 0 ? (
          <p className="muted sm mb-0 mt-0 shrink-0">
            {hidden.length} hidden.{" "}
            <PanelTip tip="Open Settings and jump to Hidden from panel">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenBookmarksHiddenSettings}
                aria-label="Open Settings and jump to Hidden from panel to manage hidden bookmarks"
              >
                Settings &gt; Bookmarks &gt; Hidden from panel
              </button>
            </PanelTip>
          </p>
        ) : null}
        <div ref={listHostRef} className="flex min-h-0 flex-1 flex-col">
          {visibleMarks.length > 0 ? (
            <HudVirtualList
              items={visibleMarks}
              itemHeight={BOOKMARKS_ROW_HEIGHT_PX}
              getItemKey={(b) => b.id}
              aria-label="Bookmarks"
              renderItem={(b, index) => (
                <BookmarkListRow
                  bookmark={b}
                  index={index}
                  total={visibleMarks.length}
                  searchActive={searchActive}
                  onReorder={handleReorder}
                  onHide={onHideBookmark}
                />
              )}
            />
          ) : (
            <p className="muted font-mono text-sm">
              {searchActive ? "No bookmarks match that search." : "No recent bookmarks yet."}
            </p>
          )}
        </div>
      </PanelBody>
    </section>
  );
}
