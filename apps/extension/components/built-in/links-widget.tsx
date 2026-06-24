import { ChevronDown, ChevronUp, EyeOff } from "lucide-react";
import React from "react";
import browser from "webextension-polyfill";
import { coerceAlarmMetaMessage } from "../../lib/alarm-meta-message";
import {
  applyBookmarksStripPreferences,
  reorderBookmarksStripVisibleIds,
  type TBookmarksStripItem,
} from "../../lib/bookmarks-strip-preferences";
import { rankBookmarksBySearchRelevance } from "../../lib/bookmark-search-relevance";
import { faviconUrl } from "../../lib/favicon-url";
import { HudTip } from "../hud-tip";
import { HudPanelBody, HudPanelTitle, HudPanelTitleInline } from "../hud-panel-drag-context";

export function TopSitesWidget({
  permissionsEpoch,
  onOpenTopSitesSettings,
}: {
  permissionsEpoch: number;
  onOpenTopSitesSettings: () => void;
}) {
  const [sites, setSites] = React.useState<{ url?: string; title?: string }[]>([]);
  const [err, setErr] = React.useState<"permission" | null>(null);

  React.useEffect(() => {
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
        <HudPanelTitle>Top sites</HudPanelTitle>
        <HudPanelBody>
          <p className="err">
            Top sites needs browser permission. Open{" "}
            <HudTip tip="Open Settings and jump to Optional permissions">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenTopSitesSettings}
                aria-label="Open Settings and jump to Optional permissions to enable Top sites"
              >
                Settings &gt; Optional permissions
              </button>
            </HudTip>{" "}
            and enable Top sites.
          </p>
        </HudPanelBody>
      </section>
    );

  return (
    <section className="card">
      <HudPanelTitle>Top sites</HudPanelTitle>
      <HudPanelBody>
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
      </HudPanelBody>
    </section>
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
  const [marks, setMarks] = React.useState<{ id: string; title?: string; url?: string }[]>([]);
  const [query, setQuery] = React.useState("");
  const [err, setErr] = React.useState<"permission" | null>(null);

  const trimmedQuery = query.trim();
  const searchActive = trimmedQuery.length > 0;

  React.useEffect(() => {
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
          ).slice(0, 32),
        )
      : api.getRecent(16);
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
  }, [permissionsEpoch, searchActive, trimmedQuery]);

  const visibleMarks = React.useMemo(
    () => applyBookmarksStripPreferences(marks, hidden, orderIds),
    [hidden, marks, orderIds],
  );

  const handleReorder = React.useCallback(
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
      <section className="card">
        <HudPanelTitle>Bookmarks</HudPanelTitle>
        <HudPanelBody>
          <p className="err">
            Bookmarks need browser permission. Open{" "}
            <HudTip tip="Open Settings and jump to Optional permissions">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenBookmarksPermissionSettings}
                aria-label="Open Settings and jump to Optional permissions to enable Bookmarks"
              >
                Settings &gt; Optional permissions
              </button>
            </HudTip>{" "}
            and enable Bookmarks.
          </p>
        </HudPanelBody>
      </section>
    );

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HudPanelTitleInline>Bookmarks</HudPanelTitleInline>
        <input
          type="search"
          className="w-[8.5rem] max-w-[min(42%,12rem)] shrink-0 rounded-full border border-solid border-accent/30 bg-black/40 px-3 py-1 text-xs text-text normal-case tracking-normal backdrop-blur-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent2/60"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search bookmarks"
        />
      </div>
      <HudPanelBody>
        {hidden.length > 0 ? (
          <p className="muted sm mb-2 mt-0">
            {hidden.length} hidden.{" "}
            <HudTip tip="Open Settings and jump to Hidden from panel">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenBookmarksHiddenSettings}
                aria-label="Open Settings and jump to Hidden from panel to manage hidden bookmarks"
              >
                Settings &gt; Bookmarks &gt; Hidden from panel
              </button>
            </HudTip>
          </p>
        ) : null}
        <ul className="link-grid">
          {visibleMarks.map((b, index) => {
            const label = coerceAlarmMetaMessage(b.title as unknown) || b.url || "";
            const cannotMoveUp = searchActive || index === 0;
            const cannotMoveDown = searchActive || index >= visibleMarks.length - 1;
            return (
              <li key={b.id} className="link-grid-row">
                <HudTip tip={label} wrapClassName="block min-w-0 flex-1">
                  <a href={b.url} target="_blank" rel="noreferrer">
                    <img
                      src={faviconUrl(b.url ?? "")}
                      alt=""
                      width={16}
                      height={16}
                      className="favicon"
                    />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </a>
                </HudTip>
                <div className="link-grid-row-actions">
                  {!searchActive ? (
                    <>
                      <HudTip
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
                          onClick={() => handleReorder(b.id, "up")}
                        >
                          <ChevronUp size={14} strokeWidth={2} aria-hidden />
                        </button>
                      </HudTip>
                      <HudTip
                        tip={
                          cannotMoveDown
                            ? "Already last in the list"
                            : "Move this bookmark later in the list"
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
                          onClick={() => handleReorder(b.id, "down")}
                        >
                          <ChevronDown size={14} strokeWidth={2} aria-hidden />
                        </button>
                      </HudTip>
                    </>
                  ) : null}
                  <HudTip tip="Hide this bookmark from the panel (unhide in Settings > Bookmarks)">
                    <button
                      type="button"
                      className="btn ghost icon-only sm"
                      aria-label="Hide bookmark from panel"
                      onClick={() =>
                        onHideBookmark({
                          id: b.id,
                          title: b.title,
                          url: b.url,
                        })
                      }
                    >
                      <EyeOff size={14} strokeWidth={2} aria-hidden />
                    </button>
                  </HudTip>
                </div>
              </li>
            );
          })}
        </ul>
      </HudPanelBody>
    </section>
  );
}
